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
    const page=ref('menu'),board=ref(null),primary=ref(null),flappy=ref(null);
    const expanded=ref(false),showHelp=ref(read('help','true')!=='false'),confirmRestart=ref(false);
    const expandedWidth=ref(800),globalControlsWidth=ref(240),landscapeControls=ref(false);
    let previousScroll=0,resizeId=0;
    async function sizeExpanded(){
      if(!expanded.value||!isNativePage())return;
      const id=++resizeId;
      for(let pass=0;pass<2;pass++){
        await nextTick();if(id!==resizeId||!expanded.value)return;
        const layout=document.querySelector('.play-layout'),machine=document.querySelector('.machine'),pad=document.querySelector('.direction-pad');
        if(!layout||!machine||!board.value)return;
        const width=window.visualViewport?.width??innerWidth,height=window.visualViewport?.height??innerHeight;
        const padVisible=pad&&getComputedStyle(pad).display!=='none';
        landscapeControls.value=!!padVisible&&width>=600&&height<=520&&width>height;
        globalControlsWidth.value=document.querySelector('.global-controls')?.getBoundingClientRect().width??240;
        await nextTick();if(id!==resizeId||!expanded.value)return;
        const area=layout.getBoundingClientRect(),outer=machine.getBoundingClientRect(),screen=board.value.getBoundingClientRect();
        const padHeight=padVisible&&!landscapeControls.value?pad.getBoundingClientRect().height+parseFloat(getComputedStyle(pad).marginTop):0;
        const chromeWidth=outer.width-screen.width,chromeHeight=outer.height-screen.height;
        expandedWidth.value=Math.max(80,Math.min(area.width,Math.max(40,area.height-padHeight-chromeHeight)*288/256+chromeWidth));
      }
    }
    const status=ref('ready'),score=ref(0),level=ref(1),lives=ref(5),remaining=ref(0),announcement=ref('');
    const storedBest=Number(read('pampuch.best','0'));const best=ref(Number.isSafeInteger(storedBest)&&storedBest>=0?storedBest:0);
    const version=ArcadeVersion,commit=ref(''),isFile=location.protocol==='file:',year=new Date().getFullYear();
    let game;try{game=Pampuch.restore(JSON.parse(read('pampuch.v2','null')));}catch{}game??=new Pampuch();
    const sessions={pampuch:game},gameTypes={pampuch:Pampuch,boulder:Boulder,auto:AutoGame,zaby:ZabyGame,manic:ManicGame,cihly:CihlyGame,manic2:Manic2Game,saboter:SaboterGame,invaders:InvadersGame};let gameId='pampuch';
    const isBoulder=computed(()=>page.value==='boulder');
    const isAuto=computed(()=>page.value==='auto'),isPampuch=computed(()=>page.value==='pampuch');
    const isZaby=computed(()=>page.value==='zaby');
    const isManic=computed(()=>page.value==='manic');
    const isSaboter=computed(()=>page.value==='saboter');
    const isInvaders=computed(()=>page.value==='invaders'),invadersDifficulty=ref(0);
    const isCihly=computed(()=>page.value==='cihly');
    const isManic2=computed(()=>page.value==='manic2'),manic2Mode=ref('normal');
    const isPlatformer=computed(()=>isManic.value||isManic2.value);
    const isNativePage=()=>Object.hasOwn(gameTypes,page.value);
    let savedCompleted;try{savedCompleted=JSON.parse(read('pampuch.completed','[]'));}catch{}
    const completedMaps=ref(Array.isArray(savedCompleted)?[...new Set(savedCompleted.filter(n=>Number.isInteger(n)&&n>=1&&n<=11))].sort((a,b)=>a-b):[]);
    const levelsOpen=ref(false),levelPicker=ref(null),levelTrigger=ref(null),currentMap=ref(game.map);
    const maps=Array.from({length:11},(_,i)=>i+1);let stateBeforeLevels='ready';
    const canChooseMap=map=>map===1||completedMaps.value.includes(map)||completedMaps.value.includes(map-1);
    function rememberCompleted(){if(!(game instanceof Pampuch))return;const merged=[...new Set([...completedMaps.value,...game.completedMaps])].sort((a,b)=>a-b);if(merged.length!==completedMaps.value.length){completedMaps.value=merged;write('pampuch.completed',JSON.stringify(merged));}}
    rememberCompleted();
    let frameId,last=0,previousState='',stateBeforeConfirm='ready',lastSavedAt=0;
    const t=key=>PmdTranslations[language.value][key]??key;
    const overlayKey=computed(()=>confirmRestart.value?'confirm':({ready:'ready',paused:'paused',dead:'dead',over:'over',won:'won',level:'level'}[status.value]??'ready'));
    const gameText=(suffix,fallback)=>t(isPampuch.value?fallback:page.value+suffix);
    const overlayTitle=computed(()=>isInvaders.value&&!confirmRestart.value&&status.value==='level'?t('invadersLevel'):!confirmRestart.value&&status.value==='ready'?gameText('Ready','ready'):isAuto.value&&!confirmRestart.value&&status.value==='over'?t('autoFinished'):t(overlayKey.value));
    const overlayText=computed(()=>isInvaders.value&&!confirmRestart.value&&status.value==='level'?t('invadersLevelText'):((isAuto.value||isZaby.value||isPlatformer.value||isCihly.value||isSaboter.value||isInvaders.value)&&!confirmRestart.value&&status.value==='paused'?gameText('PausedText',''):!isPampuch.value&&!confirmRestart.value&&['ready','over','won'].includes(status.value)?gameText((status.value==='ready'?'Ready':status.value==='won'?'Won':'Over')+'Text',''):t(overlayKey.value+'Text')).replace('{crashes}',String(score.value)));
    const primaryText=computed(()=>t(confirmRestart.value?'new':status.value==='ready'?'start':['over','won'].includes(status.value)?'new':status.value==='level'?(isInvaders.value?'invadersNext':'next'):'resume'));
    const touchDirections=computed(()=>isZaby.value?[{name:'newFrog',symbol:'↻'},{name:'up',symbol:'↑'}]:[{name:'up',symbol:'↑'},{name:'left',symbol:'←'},{name:'down',symbol:'↓'},{name:'right',symbol:'→'}].filter(d=>!(isAuto.value||isPlatformer.value||isCihly.value||isInvaders.value)||['left','right'].includes(d.name)));
    const saveKey=id=>id==='pampuch'?'pampuch.v2':id+'.v1';
    function save(){write(saveKey(gameId),JSON.stringify(game.snapshot()));}
    function paint(){if(board.value)PampuchRender.render(board.value.getContext('2d'),game,best.value);}
    function sync(){
      status.value=game.state;lives.value=game.lives;
      if(isPampuch.value){score.value=game.score;level.value=game.level;remaining.value=game.remaining;currentMap.value=game.map;rememberCompleted();}
      if(isAuto.value){score.value=game.crashes;remaining.value=game.lapsRemaining;}
      if(isPampuch.value&&score.value>best.value){best.value=score.value;write('pampuch.best',String(best.value));}
      for(const event of game.takeEvents())audio.play(event);
      if(previousState!==game.state){previousState=game.state;announcement.value=game.state==='playing'?'':t(overlayKey.value);if(game.state!=='playing')void nextTick(()=>primary.value?.focus({preventScroll:true}));}
      paint();
    }
    function focusBoard(event){if(game.state==='playing'){event?.preventDefault();board.value?.focus({preventScroll:true});}}
    function primaryAction(){
      audio.unlock();if(isInvaders.value)game.difficulty=invadersDifficulty.value;
      if(confirmRestart.value||['over','won'].includes(game.state)){audio.stop();if(typeof game.restart==='function')game.restart();else{game=new gameTypes[gameId]();if(isManic2.value)game.training=manic2Mode.value==='training';game.start();}confirmRestart.value=false;}
      else if(game.state==='paused')game.state='playing';
      else if(game.state==='ready'){audio.stop();if(isManic2.value)game.training=manic2Mode.value==='training';game.start();}else game.continue();
      last=performance.now();game.release();sync();save();void nextTick(()=>board.value?.focus({preventScroll:true}));
    }
    function pause(){game.release();if(game.state==='playing'){game.state='paused';audio.stop();sync();save();}}
    function togglePause(){if(confirmRestart.value||levelsOpen.value)return;if(game.state==='playing')pause();else if(game.state==='paused')primaryAction();}
    function requestRestart(){if(confirmRestart.value||levelsOpen.value)return;if(isInvaders.value)invadersDifficulty.value=game.difficulty;if(isManic2.value)manic2Mode.value=game.training?'training':'normal';stateBeforeConfirm=game.state;pause();confirmRestart.value=true;audio.stop();void nextTick(()=>primary.value?.focus());}
    function openLevels(){if(!isPampuch.value||confirmRestart.value||levelsOpen.value)return;flushInputClock();stateBeforeLevels=game.state;pause();levelsOpen.value=true;audio.stop();void nextTick(()=>{const panel=levelPicker.value;(panel?.querySelector(`[data-map="${currentMap.value}"]:not(:disabled)`)??panel?.querySelector('[data-map]:not(:disabled)'))?.focus();});}
    function closeLevels(){levelsOpen.value=false;game.state=stateBeforeLevels;last=performance.now();sync();save();void nextTick(()=>{if(game.state==='playing')board.value?.focus({preventScroll:true});else levelTrigger.value?.focus({preventScroll:true});});}
    function chooseMap(map){if(!Number.isInteger(map)||map<1||map>11||!canChooseMap(map))return;rememberCompleted();audio.unlock();audio.stop();game=new Pampuch(map);levelsOpen.value=false;game.start();last=performance.now();sync();save();void nextTick(()=>board.value?.focus({preventScroll:true}));}
    function levelKeys(event){if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;const buttons=[...levelPicker.value.querySelectorAll('[data-map]:not(:disabled)')];if(!buttons.length)return;event.preventDefault();const index=buttons.indexOf(document.activeElement),step=['ArrowLeft','ArrowUp'].includes(event.key)?-1:1;let next=(index+step+buttons.length)%buttons.length;if(event.key==='Home')next=0;if(event.key==='End')next=buttons.length-1;buttons[next].focus();}
    function cancelRestart(){if(isInvaders.value)invadersDifficulty.value=game.difficulty;if(isManic2.value)manic2Mode.value=game.training?'training':'normal';confirmRestart.value=false;game.state=stateBeforeConfirm;last=performance.now();sync();save();void nextTick(()=>board.value?.focus({preventScroll:true}));}
    function toggleSound(){sound.value=!sound.value;audio.enabled=sound.value;write('sound',String(sound.value));if(sound.value)audio.unlock();else audio.stop();}
    function unlockAudio(){audio.unlock();}
    function route(){
      pause();levelsOpen.value=false;confirmRestart.value=false;expanded.value=false;audio.stop();
      sessions[gameId]=game;
      // Unmounting Flappy releases its timers, audio, and keyboard handlers.
      const path=location.hash.replace(/^#\/?/,'').replace(/\/$/,'');page.value=path||'menu';
      if(isNativePage()){gameId=page.value;if(!sessions[gameId]){try{sessions[gameId]=gameTypes[gameId].restore(JSON.parse(read(saveKey(gameId),'null')));}catch{}sessions[gameId]??=new gameTypes[gameId]();}game=sessions[gameId];}
      if(isManic2.value)manic2Mode.value=game.training?'training':'normal';if(isInvaders.value)invadersDifficulty.value=game.difficulty;
      previousState='';last=performance.now();
      void nextTick(()=>{if(isNativePage())sync();});
    }
    function flushInputClock(){const now=performance.now();if(isNativePage()&&!document.hidden&&!confirmRestart.value&&game.state==='playing'){game.advance(Math.min(now-(last||now),250));sync();}last=now;}
    function touchMove(direction,event){audio.unlock();if(game.state!=='playing'||confirmRestart.value)return;flushInputClock();event.currentTarget.setPointerCapture?.(event.pointerId);game.turn(direction);focusBoard();}
    function releaseDirection(direction){flushInputClock();game.turn(direction,false);}
    function keyup(event){if(!isNativePage())return;if(((isBoulder.value||isPlatformer.value||isSaboter.value||isInvaders.value)&&['Space','ShiftLeft','ShiftRight'].includes(event.code))||(isZaby.value&&event.code==='Space'))releaseDirection('action');if(isZaby.value&&event.code==='KeyR')releaseDirection('newFrog');if(keyDirections[event.code])releaseDirection(keyDirections[event.code]);}
    function trapFocus(event){const buttons=event.currentTarget.querySelectorAll('button:not(:disabled),select:not(:disabled),input:not(:disabled)');const first=buttons[0],lastButton=buttons[buttons.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();lastButton.focus();}else if(!event.shiftKey&&document.activeElement===lastButton){event.preventDefault();first.focus();}}
    const keyDirections={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',KeyW:'up',KeyS:'down',KeyA:'left',KeyD:'right'};
    function keydown(event){
      if(event.defaultPrevented||event.isComposing||event.ctrlKey||event.altKey||event.metaKey||(event.shiftKey&&!isBoulder.value&&!isPlatformer.value&&!isSaboter.value&&!isInvaders.value))return;
      if(event.target.closest?.('input,select,textarea,[contenteditable="true"]'))return;
      if(page.value==='flappy')return;
      audio.unlock();
      if(event.code==='KeyZ'){event.preventDefault();if(!event.repeat)toggleSound();return;}
      if(!isNativePage())return;
      if(levelsOpen.value){if(event.code==='Escape'){event.preventDefault();if(!event.repeat)closeLevels();}return;}
      if(confirmRestart.value){if(event.repeat)return;if(['Escape','Backspace'].includes(event.code)){event.preventDefault();cancelRestart();}else if(['Enter','KeyN'].includes(event.code)){event.preventDefault();primaryAction();}return;}
      if(event.code==='KeyF'){event.preventDefault();if(!event.repeat)expanded.value=!expanded.value;return;}
      if(event.code==='KeyH'){event.preventDefault();if(!event.repeat)showHelp.value=!showHelp.value;return;}
      if(event.code==='KeyN'){event.preventDefault();if(!event.repeat)requestRestart();return;}
      if(event.code==='Escape'&&expanded.value){event.preventDefault();expanded.value=false;return;}
      if(['KeyP','Escape'].includes(event.code)){event.preventDefault();if(!event.repeat)togglePause();return;}
      if(isZaby.value&&event.code==='KeyR'){event.preventDefault();if(game.state==='playing'){flushInputClock();game.turn('newFrog');}return;}
      if(event.target.closest?.('button,a'))return;
      if(['Enter','Space'].includes(event.code)&&game.state!=='playing'){event.preventDefault();if(!event.repeat)primaryAction();return;}
      if(((isBoulder.value||isPlatformer.value||isSaboter.value||isInvaders.value)&&['Space','ShiftLeft','ShiftRight'].includes(event.code))||(isZaby.value&&event.code==='Space')){event.preventDefault();if(game.state==='playing'){flushInputClock();game.turn('action');}return;}
      if(keyDirections[event.code]){event.preventDefault();if(game.state==='playing'){flushInputClock();game.turn(keyDirections[event.code]);}}
    }
    function visibility(){if(document.hidden)pause();}
    function blur(){pause();audio.stop();}
    function frame(now){
      const dt=Math.min(now-(last||now),250);last=now;
      if(isNativePage()&&!document.hidden&&!confirmRestart.value&&(game.state==='playing'||((isPlatformer.value||isSaboter.value)&&game.state==='ready'&&document.hasFocus()))){
        game.advance(dt);sync();
        if(now-lastSavedAt>=1000){save();lastSavedAt=now;}
      }
      frameId=requestAnimationFrame(frame);
    }
    watch(language,()=>{write('language',language.value);document.documentElement.lang=language.value;document.querySelector('meta[name="description"]').content=t('description');document.title='PMD 85 Games';});
    watch(palette,()=>{write('palette',palette.value);document.documentElement.dataset.palette=palette.value;});
    watch(showHelp,()=>write('help',String(showHelp.value)));
    watch(invadersDifficulty,value=>{if(isInvaders.value&&['ready','level'].includes(game.state)&&!confirmRestart.value){game.difficulty=value;save();}});
    watch(manic2Mode,value=>{if(isManic2.value&&game.state==='ready'&&!confirmRestart.value){game.training=value==='training';save();}});
    watch(expanded,async value=>{resizeId++;document.body.classList.toggle('pampuch-expanded',value);if(value){previousScroll=window.scrollY;await sizeExpanded();}else{landscapeControls.value=false;await nextTick();window.scrollTo(0,previousScroll);}});
    watch(language,()=>void sizeExpanded());
    onMounted(()=>{
      document.documentElement.lang=language.value;document.documentElement.dataset.palette=palette.value;
      route();frameId=requestAnimationFrame(frame);
      window.addEventListener('hashchange',route);window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',visibility);
      window.addEventListener('resize',sizeExpanded);window.visualViewport?.addEventListener('resize',sizeExpanded);
      if(!isFile)fetch('commit.json',{cache:'no-cache'}).then(r=>r.json()).then(m=>{if(m.version===version&&/^[a-f0-9]{7,40}$/.test(m.commit))commit.value=m.commit.slice(0,7);}).catch(()=>{});
    });
    onUnmounted(()=>{cancelAnimationFrame(frameId);audio.stop();document.body.classList.remove('pampuch-expanded');window.removeEventListener('resize',sizeExpanded);window.visualViewport?.removeEventListener('resize',sizeExpanded);window.removeEventListener('hashchange',route);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);window.removeEventListener('pagehide',save);document.removeEventListener('visibilitychange',visibility);});
    return{t,gameText,language,palette,palettes,sound,toggleSound,unlockAudio,page,isBoulder,isAuto,isPampuch,isZaby,isManic,isCihly,isSaboter,isInvaders,invadersDifficulty,isManic2,isPlatformer,manic2Mode,board,primary,flappy,expanded,expandedWidth,globalControlsWidth,landscapeControls,showHelp,confirmRestart,status,score,best,level,lives,remaining,announcement,version,commit,isFile,year,touchDirections,overlayTitle,overlayText,primaryText,primaryAction,togglePause,requestRestart,cancelRestart,focusBoard,touchMove,releaseDirection,trapFocus,storageAvailable,completedMaps,levelsOpen,levelPicker,levelTrigger,currentMap,maps,canChooseMap,openLevels,closeLevels,chooseMap,levelKeys};
  }}).mount('#app');
})();
