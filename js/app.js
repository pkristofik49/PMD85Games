(() => {
  const {createApp,ref,computed,watch,nextTick,onMounted,onUnmounted}=Vue;
  createApp({setup(){
    const storageAvailable=ref(true);
    function read(key,fallback){try{return localStorage.getItem('pmd85games.'+key)??fallback;}catch{storageAvailable.value=false;return fallback;}}
    function write(key,value){try{localStorage.setItem('pmd85games.'+key,value);}catch{storageAvailable.value=false;}}
    const language=ref(read('language','cs')==='en'?'en':'cs');
    const palettes=['green','light','dark','red','blue'];const storedPalette=read('palette','green');
    const palette=ref(palettes.includes(storedPalette)?storedPalette:'green');
    const sound=ref(read('sound','false')==='true'),audio=new PmdAudio();audio.enabled=sound.value;
    const page=ref('menu'),board=ref(null),preview=ref(null),primary=ref(null),flappy=ref(null);
    const expanded=ref(false),showHelp=ref(read('help','true')!=='false'),confirmRestart=ref(false);
    const status=ref('ready'),score=ref(0),level=ref(1),lives=ref(5),remaining=ref(0),announcement=ref('');
    const storedBest=Number(read('pampuch.best','0'));const best=ref(Number.isSafeInteger(storedBest)&&storedBest>=0?storedBest:0);
    const version=ArcadeVersion,commit=ref(''),isFile=location.protocol==='file:',year=new Date().getFullYear();
    let game;try{game=Pampuch.restore(JSON.parse(read('pampuch.v2','null')));}catch{}game??=new Pampuch();
    let frameId,last=0,previousState='',stateBeforeConfirm='ready',lastSavedAt=0;
    const t=key=>PmdTranslations[language.value][key]??key;
    const overlayKey=computed(()=>confirmRestart.value?'confirm':({ready:'ready',paused:'paused',dead:'dead',over:'over',level:'level'}[status.value]??'ready'));
    const overlayTitle=computed(()=>t(overlayKey.value));const overlayText=computed(()=>t(overlayKey.value+'Text'));
    const primaryText=computed(()=>t(confirmRestart.value?'new':status.value==='ready'?'start':status.value==='over'?'new':status.value==='level'?'next':'resume'));
    const touchDirections=[{name:'up',symbol:'↑'},{name:'left',symbol:'←'},{name:'down',symbol:'↓'},{name:'right',symbol:'→'}];
    function save(){write('pampuch.v2',JSON.stringify(game.snapshot()));}
    function paint(){if(board.value)PampuchRender.render(board.value.getContext('2d'),game,best.value);}
    function sync(){
      status.value=game.state;score.value=game.score;level.value=game.level;lives.value=game.lives;remaining.value=game.remaining;
      if(score.value>best.value){best.value=score.value;write('pampuch.best',String(best.value));}
      for(const event of game.takeEvents())audio.play(event);
      if(previousState!==game.state){previousState=game.state;announcement.value=game.state==='playing'?'':t(overlayKey.value);if(game.state!=='playing')void nextTick(()=>primary.value?.focus({preventScroll:true}));}
      paint();
    }
    function menuPreview(){if(preview.value)PampuchRender.render(preview.value.getContext('2d'),new Pampuch(),best.value);}
    function focusBoard(event){if(game.state==='playing'){event?.preventDefault();board.value?.focus({preventScroll:true});}}
    function primaryAction(){
      audio.unlock();
      if(confirmRestart.value||game.state==='over'){game=new Pampuch();game.start();confirmRestart.value=false;}
      else if(game.state==='paused')game.state='playing';
      else if(game.state==='ready')game.start();else game.continue();
      last=performance.now();game.release();sync();save();void nextTick(()=>board.value?.focus({preventScroll:true}));
    }
    function pause(){game.release();if(game.state==='playing'){game.state='paused';audio.stop();sync();save();}}
    function togglePause(){if(confirmRestart.value)return;if(game.state==='playing')pause();else if(game.state==='paused')primaryAction();}
    function requestRestart(){if(confirmRestart.value)return;stateBeforeConfirm=game.state;pause();confirmRestart.value=true;audio.stop();void nextTick(()=>primary.value?.focus());}
    function cancelRestart(){confirmRestart.value=false;game.state=stateBeforeConfirm;last=performance.now();sync();save();void nextTick(()=>board.value?.focus({preventScroll:true}));}
    function toggleSound(){sound.value=!sound.value;audio.enabled=sound.value;write('sound',String(sound.value));if(sound.value)audio.unlock();else audio.stop();}
    function route(){
      pause();confirmRestart.value=false;expanded.value=false;audio.stop();
      // Unmounting Flappy releases its timers, audio, and keyboard handlers.
      const path=location.hash.replace(/^#\/?/,'').replace(/\/$/,'');page.value=path||'menu';
      void nextTick(()=>{if(page.value==='menu')menuPreview();else if(page.value==='pampuch')sync();});
    }
    function flushInputClock(){const now=performance.now();if(page.value==='pampuch'&&!document.hidden&&!confirmRestart.value&&game.state==='playing'){game.advance(Math.min(now-(last||now),250));sync();}last=now;}
    function touchMove(direction,event){audio.unlock();if(game.state!=='playing'||confirmRestart.value)return;flushInputClock();event.currentTarget.setPointerCapture?.(event.pointerId);game.turn(direction);focusBoard();}
    function releaseDirection(direction){flushInputClock();game.turn(direction,false);}
    function keyup(event){if(keyDirections[event.code])releaseDirection(keyDirections[event.code]);}
    function trapFocus(event){const buttons=event.currentTarget.querySelectorAll('button');const first=buttons[0],lastButton=buttons[buttons.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();lastButton.focus();}else if(!event.shiftKey&&document.activeElement===lastButton){event.preventDefault();first.focus();}}
    const keyDirections={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',KeyW:'up',KeyS:'down',KeyA:'left',KeyD:'right'};
    function keydown(event){
      if(event.defaultPrevented||event.isComposing||event.ctrlKey||event.altKey||event.metaKey||event.shiftKey)return;
      if(event.target.closest?.('input,select,textarea,[contenteditable="true"]'))return;
      if(page.value==='flappy')return;
      audio.unlock();
      if(event.code==='KeyZ'){event.preventDefault();if(!event.repeat)toggleSound();return;}
      if(page.value!=='pampuch')return;
      if(confirmRestart.value){if(event.repeat)return;if(['Escape','Backspace'].includes(event.code)){event.preventDefault();cancelRestart();}else if(['Enter','KeyN'].includes(event.code)){event.preventDefault();primaryAction();}return;}
      if(event.code==='KeyF'){event.preventDefault();if(!event.repeat)expanded.value=!expanded.value;return;}
      if(event.code==='KeyH'){event.preventDefault();if(!event.repeat)showHelp.value=!showHelp.value;return;}
      if(event.code==='KeyN'){event.preventDefault();if(!event.repeat)requestRestart();return;}
      if(event.code==='Escape'&&expanded.value){event.preventDefault();expanded.value=false;return;}
      if(['KeyP','Escape'].includes(event.code)){event.preventDefault();if(!event.repeat)togglePause();return;}
      if(event.target.closest?.('button,a'))return;
      if(['Enter','Space'].includes(event.code)&&game.state!=='playing'){event.preventDefault();if(!event.repeat)primaryAction();return;}
      if(keyDirections[event.code]){event.preventDefault();if(game.state==='playing'){flushInputClock();game.turn(keyDirections[event.code]);}}
    }
    function visibility(){if(document.hidden)pause();}
    function blur(){pause();audio.stop();}
    function frame(now){
      const dt=Math.min(now-(last||now),250);last=now;
      if(page.value==='pampuch'&&!document.hidden&&!confirmRestart.value&&game.state==='playing'){
        game.advance(dt);sync();
        if(now-lastSavedAt>=1000){save();lastSavedAt=now;}
      }
      frameId=requestAnimationFrame(frame);
    }
    watch(language,()=>{write('language',language.value);document.documentElement.lang=language.value;document.querySelector('meta[name="description"]').content=t('description');document.title='PMD 85 Games';});
    watch(palette,()=>{write('palette',palette.value);document.documentElement.dataset.palette=palette.value;});
    watch(showHelp,()=>write('help',String(showHelp.value)));
    onMounted(()=>{
      document.documentElement.lang=language.value;document.documentElement.dataset.palette=palette.value;
      route();frameId=requestAnimationFrame(frame);
      window.addEventListener('hashchange',route);window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',visibility);
      if(!isFile)fetch('commit.json',{cache:'no-cache'}).then(r=>r.json()).then(m=>{if(m.version===version&&/^[a-f0-9]{7,40}$/.test(m.commit))commit.value=m.commit.slice(0,7);}).catch(()=>{});
    });
    onUnmounted(()=>{cancelAnimationFrame(frameId);audio.stop();window.removeEventListener('hashchange',route);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);window.removeEventListener('pagehide',save);document.removeEventListener('visibilitychange',visibility);});
    return{t,language,palette,palettes,sound,toggleSound,page,board,preview,primary,flappy,expanded,showHelp,confirmRestart,status,score,best,level,lives,remaining,announcement,version,commit,isFile,year,touchDirections,overlayTitle,overlayText,primaryText,primaryAction,togglePause,requestRestart,cancelRestart,focusBoard,touchMove,releaseDirection,trapFocus,storageAvailable};
  }}).mount('#app');
})();
