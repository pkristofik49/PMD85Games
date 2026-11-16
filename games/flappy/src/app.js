import { createApp, ref, computed, watch, nextTick, onMounted, onUnmounted } from '../vendor/vue.esm-browser.prod.js';
import { levels } from '../assets/game-data.js';
import { Game } from './engine.js';
import { render } from './render.js';
import {LANGUAGE_KEY,languages,loadLanguage,translate,plural as translatePlural} from './i18n.js';
import {GameAudio,SOUND_KEY,loadSound} from './audio.js';
import {LevelTransition} from './transition.js';
import {GRAPHICS_KEY,graphicsModes,loadGraphics,loadModernSprites,titleScreens,pcTitle} from './graphics.js';
import {retroModes} from './retro.js';
import {Motion} from './motion.js';
import {findSectorPassword,availableSectors} from './passwords.js';
const STORAGE='flappy-pmd85-progress-v1';
const DEATH_MS=720;
function loadProgress(){try{const p=JSON.parse(localStorage.getItem(STORAGE));return {unlocked:Math.max(1,Math.min(200,Math.floor(Number(p?.unlocked)||1))),scene:Math.max(1,Math.min(200,Math.floor(Number(p?.scene)||1))),bonus:Array.isArray(p?.bonus)?p.bonus.filter(n=>Number.isInteger(n)&&n>=1&&n<=200):[]}}catch{return{unlocked:1,scene:1,bonus:[]}}}
createApp({setup(){
  const language=ref(loadLanguage());
  const t=(key,parameters)=>translate(language.value,key,parameters);
  const plural=(key,count)=>translatePlural(language.value,key,count);
  const progress=loadProgress(),unlocked=ref(progress.unlocked),bonusScenes=ref(progress.bonus);
  const accessibleScenes=computed(()=>availableSectors(unlocked.value,bonusScenes.value));
  const canvas=ref(null),scene=ref(accessibleScenes.value.includes(progress.scene)?progress.scene:1);
  const sectorMenuOpen=ref(false),sectorTrigger=ref(null),sectorGrid=ref(null),sectorOverlay=ref(null);
  let sectorAutoPaused=false;
  const mode=ref('ready'),lives=ref(5),ammo=ref(0),remaining=ref(360),sound=ref(loadSound()),installPrompt=ref(null),message=ref(''),notice=ref('');
  const passwordInput=ref(''),passwordInvalid=ref(false);
  const transitionPhase=ref('');
  const deathReady=ref(false);
  const languageMenuOpen=ref(false),languagePicker=ref(null),languageMenuButton=ref(null);
  const graphics=ref(loadGraphics()),graphicsMenuOpen=ref(false),graphicsPicker=ref(null),graphicsMenuButton=ref(null),graphicsReady=ref(false);
  let modernAtlas=null;
  const motion=new Motion();
  const expanded=ref(false),expandedWidth=ref(760),mobileLandscape=ref(false);
  const mobileLayoutQuery=window.matchMedia('(pointer:coarse) and (orientation:landscape) and (max-height:520px)');
  const gameAspect=computed(()=>graphics.value==='modern'||retroModes.includes(graphics.value)?1.6:1.2);
  const titleScreen=computed(()=>graphics.value==='modern'&&graphicsReady.value?pcTitle(modernAtlas,t('brand.name'),t('game.pcTitleSubtitle'),t('graphics.modern')):titleScreens[graphics.value]??titleScreens.mono);
  const audioAvailable=Boolean(window.AudioContext||window.webkitAudioContext);
  const audio=new GameAudio();audio.setEnabled(sound.value);
  const version=globalThis.FLAPPY_VERSION;const timeText=computed(()=>`${Math.floor(remaining.value/60)}:${String(remaining.value%60).padStart(2,'0')}`);
  let game,ctx,timer,transition=null,held=null,holdTimer,elapsed=0,last=0,deathElapsed=0,pausedFrom='playing',menuPaused=false,previousScroll=0;
  const shortcutTitle=(key,shortcut)=>t('shortcut.title',{action:t(key),key:shortcut});
  function closeMenus(restoreFocus=false,resumeMenu=true){
    const button=graphicsMenuOpen.value?graphicsMenuButton:languageMenuButton;
    languageMenuOpen.value=false;graphicsMenuOpen.value=false;
    const shouldResume=menuPaused&&resumeMenu;menuPaused=false;
    if(shouldResume&&mode.value==='paused')resume();
    if(restoreFocus)void nextTick(()=>button.value?.focus({preventScroll:true}));
  }
  function toggleLanguageMenu(){return toggleMenu('language')}
  function toggleGraphicsMenu(){return toggleMenu('graphics')}
  async function toggleMenu(kind){
    const opened=kind==='graphics'?graphicsMenuOpen:languageMenuOpen;
    const picker=kind==='graphics'?graphicsPicker:languagePicker;
    if(opened.value){closeMenus(true);return}
    closeMenus();
    menuPaused=['playing','entering','transition'].includes(mode.value)||(mode.value==='dead'&&!deathReady.value);
    if(menuPaused)togglePause();
    opened.value=true;
    await nextTick();
    if(opened.value)picker.value?.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
  }
  function onPickerBlur(event){
    const opened=event.currentTarget===graphicsPicker.value?graphicsMenuOpen.value:languageMenuOpen.value;
    if(opened&&!event.currentTarget.contains(event.relatedTarget))closeMenus();
  }
  function outsideControls(event){
    if(sectorMenuOpen.value&&!sectorOverlay.value?.contains(event.target)&&!sectorTrigger.value?.contains(event.target))closeSectors(false);
    if((languageMenuOpen.value&&!languagePicker.value?.contains(event.target))||(graphicsMenuOpen.value&&!graphicsPicker.value?.contains(event.target)))closeMenus();
  }
  async function toggleSectors(){
    if(sectorMenuOpen.value){closeSectors();return}
    closeMenus();
    sectorAutoPaused=['playing','entering','transition'].includes(mode.value)||(mode.value==='dead'&&!deathReady.value);
    if(sectorAutoPaused)togglePause();
    held=null;release();passwordInvalid.value=false;sectorMenuOpen.value=true;
    await nextTick();sectorGrid.value?.querySelector(`[data-sector="${scene.value}"]`)?.focus({preventScroll:true});
    sectorGrid.value?.querySelector(`[data-sector="${scene.value}"]`)?.scrollIntoView({block:'nearest',inline:'nearest'});
  }
  function closeSectors(restoreFocus=true){
    sectorMenuOpen.value=false;
    const shouldResume=sectorAutoPaused;sectorAutoPaused=false;
    if(shouldResume&&mode.value==='paused')resume();
    if(restoreFocus&&!shouldResume)void nextTick(()=>sectorTrigger.value?.focus({preventScroll:true}));
  }
  function sectorKey(event){
    if(!sectorMenuOpen.value)return false;
    if(event.key==='Escape'){event.preventDefault();closeSectors();return true}
    if(event.key==='Tab'){
      const options=Array.from(sectorOverlay.value?.querySelectorAll('button:not(:disabled),input:not(:disabled)')??[]),index=options.indexOf(document.activeElement);
      if(index<0||(event.shiftKey&&index===0)||(!event.shiftKey&&index===options.length-1)){event.preventDefault();options[event.shiftKey?options.length-1:0]?.focus()}
      return true;
    }
    if(event.target.closest?.('input,textarea'))return true;
    const number=Number(document.activeElement?.dataset.sector),step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-20,ArrowDown:20}[event.key];
    let target;
    if(step){event.preventDefault();for(let n=number+step;n>=1&&n<=200;n+=step)if(accessibleScenes.value.includes(n)){target=n;break}}
    if(event.key==='Home'||event.key==='End'){event.preventDefault();target=event.key==='Home'?accessibleScenes.value[0]:accessibleScenes.value.at(-1)}
    if(target)sectorGrid.value?.querySelector(`[data-sector="${target}"]`)?.focus();
    return true; // Native Enter/Space still activates the focused sector button.
  }
  function menuKey(event){
    if(!languageMenuOpen.value&&!graphicsMenuOpen.value)return false;
    const picker=graphicsMenuOpen.value?graphicsPicker:languagePicker;
    const options=Array.from(picker.value?.querySelectorAll('[data-option]:not(:disabled)')??[]);
    const index=options.indexOf(document.activeElement);
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();const step=event.key==='ArrowDown'?1:-1;
      options[index<0?(step>0?0:options.length-1):(index+step+options.length)%options.length]?.focus({preventScroll:true});return true;
    }
    if(event.key==='Enter'&&index>=0){event.preventDefault();if(!event.repeat)options[index].click();return true}
    if(event.key==='Escape'){event.preventDefault();closeMenus(true);return true}
    return false;
  }
  async function sizeExpanded(){
    mobileLandscape.value=mobileLayoutQuery.matches;
    document.body.classList.toggle('mobile-landscape',mobileLandscape.value);
    for(let pass=0;pass<2;pass++){
      await nextTick();if(!expanded.value&&!mobileLandscape.value)return;
      const machine=document.querySelector('.machine'),board=document.querySelector('.viewport');
      if(!machine||!board)return;
      const machineRect=machine.getBoundingClientRect(),boardRect=board.getBoundingClientRect();
      const width=window.visualViewport?.width??window.innerWidth,height=window.visualViewport?.height??window.innerHeight;
      const chromeHeight=machineRect.height-boardRect.height,chromeWidth=machineRect.width-boardRect.width;
      if(mobileLandscape.value){
        const mainStyle=getComputedStyle(document.querySelector('main'));
        const availableWidth=width-parseFloat(mainStyle.paddingLeft)-parseFloat(mainStyle.paddingRight);
        const availableHeight=height-parseFloat(mainStyle.paddingTop)-parseFloat(mainStyle.paddingBottom);
        expandedWidth.value=Math.max(80,Math.min(availableWidth,Math.max(40,availableHeight-chromeHeight)*gameAspect.value+chromeWidth));
      }else expandedWidth.value=Math.max(140,Math.min(width-24,Math.max(80,height-76-chromeHeight)*gameAspect.value+chromeWidth));
    }
  }
  async function toggleExpanded(){
    closeMenus();
    if(!expanded.value)previousScroll=window.scrollY;
    expanded.value=!expanded.value;
    document.body.classList.toggle('game-expanded',expanded.value);
    if(expanded.value)await sizeExpanded();else{await nextTick();if(mobileLandscape.value)await sizeExpanded();else window.scrollTo(0,previousScroll)}
    focus();
  }
  function setLanguage(code){
    if(!languages.some(option=>option.code===code))return;
    language.value=code;
    try{localStorage.setItem(LANGUAGE_KEY,code)}catch{/* Keep the in-memory choice. */}
    closeMenus();
    if(['playing','entering','transition'].includes(mode.value))focus();
    else void nextTick(()=>languageMenuButton.value?.focus({preventScroll:true}));
    if(expanded.value||mobileLandscape.value)void sizeExpanded();
  }
  function setGraphics(value){
    if(!graphicsModes.includes(value)||(value==='modern'&&!graphicsReady.value))return;
    graphics.value=value;
    try{localStorage.setItem(GRAPHICS_KEY,value)}catch{/* Keep the in-memory choice. */}
    closeMenus();paint();
    if(expanded.value||mobileLandscape.value)void sizeExpanded();
    if(['playing','entering','transition'].includes(mode.value))focus();
    else void nextTick(()=>graphicsMenuButton.value?.focus({preventScroll:true}));
  }
  watch(language,()=>{
    document.documentElement.lang=language.value;
    document.title=t('meta.title');
    document.querySelector('meta[name="description"]').content=t('meta.description');
    document.querySelector('#pwa-manifest').setAttribute('href',language.value==='en'?'./manifest.en.webmanifest':'./manifest.webmanifest');
    paint();
  },{immediate:true});
  function save(savedScene=scene.value){try{localStorage.setItem(STORAGE,JSON.stringify({scene:savedScene,unlocked:unlocked.value,bonus:bonusScenes.value}))}catch{notice.value='notice.storage'}}
  function unlockScene(n){
    if(n<=unlocked.value)return;
    if(n===unlocked.value+1){unlocked.value=n;while(unlocked.value<200&&bonusScenes.value.includes(unlocked.value+1))unlocked.value++}
    else if(!bonusScenes.value.includes(n))bonusScenes.value=[...bonusScenes.value,n];
  }
  function openPassword(){
    const found=findSectorPassword(passwordInput.value);
    if(!found){passwordInvalid.value=true;return}
    bonusScenes.value=[...new Set([...bonusScenes.value,...Array.from({length:found.last-found.first+1},(_,i)=>found.first+i)])];
    passwordInvalid.value=false;passwordInput.value='';save();void nextTick(()=>beep('start'));
  }
  function reset({entering=false}={}){game=new Game(levels[scene.value-1],{entering});motion.reset(game);remaining.value=360;elapsed=0;deathElapsed=0;deathReady.value=false;ammo.value=0;held=null;release();paint()}
  function paint(){if(ctx&&game)render(ctx,game,t('game.sleepMarker'),{scene:scene.value,lives:lives.value,timeText:timeText.value,sectorLabel:t('game.scene'),timeLabel:t('game.time'),credit:t(retroModes.includes(graphics.value)?'game.originalCredit':'game.boardCredit')},transition,{mode:graphics.value,atlas:modernAtlas,motion,showDeadPlayer:!deathReady.value})}
  function focus(){canvas.value?.focus({preventScroll:true})}
  function start(){sectorMenuOpen.value=false;sectorAutoPaused=false;transition=null;transitionPhase.value='';notice.value='';reset({entering:true});mode.value='entering';last=performance.now();focus();save();beep('start')}
  function returnTitle(){
    sectorMenuOpen.value=false;sectorAutoPaused=false;
    closeMenus(false,false);release();held=null;audio.stop();transition=null;transitionPhase.value='';
    mode.value='ready';pausedFrom='playing';lives.value=5;message.value='';notice.value='';reset();save();
    void nextTick(()=>document.querySelector('.title-screen')?.focus({preventScroll:true}));
  }
  function resume(){mode.value=pausedFrom;held=null;last=performance.now();focus()}
  function togglePause(){if(['playing','entering','transition'].includes(mode.value)||(mode.value==='dead'&&!deathReady.value)){pausedFrom=mode.value;mode.value='paused';held=null;release();audio.stop()}else if(mode.value==='paused')resume()}
  function pauseFromBoard(){if(!sectorMenuOpen.value&&mode.value!=='paused')togglePause()}
  function restart(){start()}
  function retry(){if(!lives.value)lives.value=5;start()}
  function next(){if(scene.value===200){scene.value=1;lives.value=5}else scene.value++;start()}
  function chooseScene(n){if(!accessibleScenes.value.includes(n))return;scene.value=n;lives.value=5;start()}
  function beep(event){if(sound.value&&event)void audio.play(event)}
  function toggleSound(){
    if(!audioAvailable)return;
    sound.value=!sound.value;audio.setEnabled(sound.value);
    try{localStorage.setItem(SOUND_KEY,String(sound.value))}catch{/* Keep the in-memory choice. */}
    if(sound.value)beep('collect');
    if(['playing','entering','transition'].includes(mode.value))focus();
  }
  function sync(){
    if(game.state==='playing'&&mode.value==='entering'){mode.value='playing';held=null}
    ammo.value=game.ammo;
    if(game.event){beep(game.event);game.event=null}
    if(game.state==='won'&&mode.value==='playing'){
      transition=new LevelTransition({final:scene.value===200});transitionPhase.value=transition.phase;mode.value='transition';
      notice.value=scene.value===200?'win.finished':'notice.nextRoom';
      unlockScene(Math.min(200,scene.value+1));save(Math.min(200,scene.value+1));held=null;release();
    }
    if(game.state==='dead'&&mode.value==='playing'){lives.value=Math.max(0,lives.value-1);message.value=game.reason;notice.value=game.reason;mode.value='dead';deathElapsed=0;deathReady.value=false;held=null;release();beep('dead')}
    motion.capture(game);
    paint();
  }
  function move(dx,dy){if(mode.value!=='playing')return;game.move(dx,dy);sync()}
  function fire(){if(mode.value!=='playing')return;if(!game.ammo){notice.value='notice.noAmmo';return}game.fire();sync()}
  function hold(dx,dy,event){event?.currentTarget?.setPointerCapture?.(event.pointerId);release();move(dx,dy);if(mode.value==='playing')holdTimer=setInterval(()=>move(dx,dy),120)}
  function release(){clearInterval(holdTimer);holdTimer=null}
  const directions={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],KeyW:[0,-1],KeyS:[0,1],KeyA:[-1,0],KeyD:[1,0]};
  function keydown(e){
    if(!e.defaultPrevented&&!e.isComposing&&sectorKey(e))return;
    if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||e.isComposing)return;
    if(e.target.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'))return;
    if(menuKey(e))return;
    const key=e.key.toLowerCase();
    if(key==='l'){e.preventDefault();if(!e.repeat)void toggleLanguageMenu();return}
    if(key==='z'){e.preventDefault();if(!e.repeat)toggleSound();return}
    if(key==='f'){e.preventDefault();if(!e.repeat)void toggleExpanded();return}
    if(key==='g'){e.preventDefault();if(!e.repeat)void toggleGraphicsMenu();return}
    if(languageMenuOpen.value||graphicsMenuOpen.value){if(directions[e.code])e.preventDefault();return}
    if(e.key==='Escape'&&expanded.value){e.preventDefault();void toggleExpanded();return}
    if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();if(!e.repeat)togglePause();return}
    if(e.code==='KeyR'){e.preventDefault();if(!e.repeat)restart();return}
    if(e.target.tagName==='BUTTON'&&!e.target.classList.contains('title-screen'))return;
    if(mode.value==='ready'&&(e.code==='Space'||e.code==='Enter')){e.preventDefault();if(!e.repeat)start();return}
    if(['entering','transition'].includes(mode.value)&&(directions[e.code]||e.code==='Space')){e.preventDefault();return}
    if(directions[e.code]){e.preventDefault();if(!e.repeat){held={code:e.code,dir:directions[e.code],at:performance.now()+160};move(...held.dir)}return}
    if(e.code==='Space'){e.preventDefault();if(!e.repeat)fire()}
    if(e.repeat)return;
    if(e.code==='Enter'){e.preventDefault();if(mode.value==='paused')resume();else if(mode.value==='won')next();else if(mode.value==='dead'&&deathReady.value)retry();else if(mode.value==='ready')start()}
  }
  function keyup(e){if(held?.code===e.code)held=null}
  function blur(){closeMenus(false,false);held=null;release();audio.stop();if(['playing','entering','transition'].includes(mode.value)||(mode.value==='dead'&&!deathReady.value)){pausedFrom=mode.value;mode.value='paused'}}
  function visibility(){if(document.hidden)blur()}
  function beforeInstall(e){e.preventDefault();installPrompt.value=e}
  function installed(){installPrompt.value=null;notice.value='notice.installed'}
  async function install(){const prompt=installPrompt.value;if(!prompt)return;await prompt.prompt();await prompt.userChoice;installPrompt.value=null}
  function frame(){
    const now=performance.now(),delta=Math.min(now-last,250);
    if(['playing','entering','transition'].includes(mode.value))motion.advance(delta);
    if(mode.value==='dead'&&!deathReady.value&&!document.hidden){
      deathElapsed+=delta;
      if(deathElapsed>=DEATH_MS){deathReady.value=true;if(lives.value>0)start();else paint()}
    }
    else if(mode.value==='transition'){
      const result=transition.advance(delta);transitionPhase.value=transition.phase;
      if(result.loadNext){scene.value++;reset({entering:true});save()}
      if(result.finished){
        const final=transition.final;transition=null;transitionPhase.value='';elapsed=0;held=null;
        mode.value=final?'won':'entering';
        if(notice.value==='notice.nextRoom')notice.value='';
      }
      paint();
    }
    else if(mode.value==='playing'||mode.value==='entering'){
      elapsed+=delta;
      if(held&&now>=held.at){const active=held;move(...active.dir);if(held===active)held.at=now+120}
      while(elapsed>=120&&(mode.value==='playing'||mode.value==='entering')){
        elapsed-=120;game.tick();remaining.value=Math.max(0,360-Math.floor(game.ticks*.12));sync();
      }
      if(!remaining.value&&mode.value==='playing'){game.die('death.timeout');sync()}
      if(graphics.value==='modern')paint();
    }
    last=now;timer=requestAnimationFrame(frame);
  }
  onMounted(()=>{
    void sizeExpanded();mobileLayoutQuery.addEventListener('change',sizeExpanded);
    ctx=canvas.value.getContext('2d');reset();timer=requestAnimationFrame(frame);
    void loadModernSprites().then(atlas=>{modernAtlas=atlas;graphicsReady.value=true;paint()}).catch(()=>{if(graphics.value==='modern')graphics.value='mono';notice.value='notice.graphicsUnavailable';paint()});
    window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);
    window.addEventListener('beforeinstallprompt',beforeInstall);window.addEventListener('appinstalled',installed);
    document.addEventListener('pointerdown',outsideControls);window.addEventListener('resize',sizeExpanded);window.visualViewport?.addEventListener('resize',sizeExpanded);
    if(window===window.top&&'serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(reg=>{
      if(reg.waiting)notice.value='notice.update';
      reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)notice.value='notice.update'})});
    }).catch(()=>{notice.value='notice.offlineFailed'});
  });
  onUnmounted(()=>{cancelAnimationFrame(timer);release();audio.close();document.body.classList.remove('game-expanded','mobile-landscape');mobileLayoutQuery.removeEventListener('change',sizeExpanded);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('beforeinstallprompt',beforeInstall);window.removeEventListener('appinstalled',installed);document.removeEventListener('pointerdown',outsideControls);window.removeEventListener('resize',sizeExpanded);window.visualViewport?.removeEventListener('resize',sizeExpanded)});
  return{mobileLandscape,pauseFromBoard,sectorMenuOpen,sectorTrigger,sectorGrid,sectorOverlay,toggleSectors,closeSectors,accessibleScenes,passwordInput,passwordInvalid,openPassword,returnTitle,gameAspect,titleScreen,deathReady,graphics,graphicsModes,graphicsMenuOpen,graphicsPicker,graphicsMenuButton,graphicsReady,toggleGraphicsMenu,setGraphics,language,languages,setLanguage,t,plural,shortcutTitle,languageMenuOpen,languagePicker,languageMenuButton,toggleLanguageMenu,onPickerBlur,expanded,expandedWidth,toggleExpanded,transitionPhase,canvas,scene,unlocked,mode,lives,ammo,sound,audioAvailable,toggleSound,installPrompt,message,notice,version,timeText,start,resume,togglePause,restart,retry,next,chooseScene,fire,hold,release,install};
}}).mount('#app');
