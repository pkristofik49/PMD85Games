// Browser verification with Chrome DevTools and Node's built-in WebSocket; no packages.
// Launch a dedicated Chrome with --headless=new --remote-debugging-port=9222 first.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const pages=await(await fetch('http://127.0.0.1:9222/json')).json();
const page=pages.find(p=>p.type==='page');assert.ok(page,'Chrome debugging page');
const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0,instrumentId,saved;const pending=new Map(),errors=[];
ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text+': '+m.params.exceptionDetails.exception?.description)});
function call(method,params={}){return new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}))})}
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(expression){for(let i=0;i<80;i++){if(await evaluate(expression))return;await delay(100)}throw Error('Timed out: '+expression)}
async function screenshot(file){const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/'+file,Buffer.from(r.data,'base64'))}
const titleReady=`document.querySelector('#app') && !document.querySelector('#app').hasAttribute('v-cloak') && document.querySelector('.title-screen img')?.complete && document.querySelector('.title-screen img')?.naturalWidth>0`;
async function chooseLanguage(code){
 if(await evaluate(`document.querySelector('.language-menu-toggle').getAttribute('aria-expanded')!=='true'`))await evaluate(`document.querySelector('.language-menu-toggle').click()`);
 await until(`document.querySelector('.language-menu-toggle').getAttribute('aria-expanded')==='true'`);
 await evaluate(`document.querySelector('[data-language="${code}"]').click()`);
 await until(`document.documentElement.lang==='${code}' && document.querySelector('.language-menu-toggle').getAttribute('aria-expanded')==='false' && getComputedStyle(document.querySelector('#language-options')).display==='none'`);
}
async function press(code,key,extra={}){await call('Input.dispatchKeyEvent',{type:'keyDown',code,key,...extra});await call('Input.dispatchKeyEvent',{type:'keyUp',code,key})}
try{
 await call('Runtime.enable');await call('Page.enable');await call('Network.enable');
 instrumentId=(await call('Page.addScriptToEvaluateOnNewDocument',{source:`
   window.__flappyAudioContexts=[];window.__flappyOscillators=[];
   const NativeAudio=window.AudioContext;
   if(NativeAudio)window.AudioContext=class extends NativeAudio{
     constructor(...args){super(...args);window.__flappyAudioContexts.push(this)}
     createOscillator(){const osc=super.createOscillator();window.__flappyOscillators.push(osc);return osc}
   };
 `})).identifier;
 const testUrl=process.argv[2]||'http://127.0.0.1:4173/Flappy/';
 await call('Storage.clearDataForOrigin',{origin:new URL(testUrl).origin,storageTypes:'service_workers,cache_storage'});
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:testUrl});
 await until(titleReady);
 saved=await evaluate(`JSON.stringify({...localStorage})`);
 await evaluate(`localStorage.setItem('flappy.graphics','mono');localStorage.setItem('flappy-pmd85-progress-v1',JSON.stringify({scene:1,unlocked:1}))`);
 await call('Page.reload');await delay(150);await until(titleReady);
 await chooseLanguage('cs');
 await until(`document.documentElement.lang==='cs'`);
 assert.equal(await evaluate('window.__flappyAudioContexts.length'),0,'Page loading must not initialize audio');
 assert.match(await evaluate(`document.querySelector('footer strong').textContent`),/FLAPPY v\d+\.\d{3}/);
 for(const [selector,shortcut]of [['.language-menu-toggle','L'],['.sound-button','Z'],['.fullscreen-button','F']])assert.equal(await evaluate(`document.querySelector('${selector}').getAttribute('aria-keyshortcuts')`),shortcut);
 await press('KeyL','l');await until(`document.querySelector('.language-menu-toggle').getAttribute('aria-expanded')==='true'`);
 await until(`document.activeElement?.dataset.language==='cs'`);
 await press('ArrowDown','ArrowDown');assert.equal(await evaluate(`document.activeElement.dataset.language`),'en');
 await press('Enter','Enter');await until(`document.documentElement.lang==='en' && document.querySelector('.language-menu-toggle').getAttribute('aria-expanded')==='false'`);
 assert.equal(await evaluate(`document.querySelector('canvas').dataset.state`),'ready','Menu Enter must not start the game');
 await chooseLanguage('cs');
 await press('KeyF','f');await until(`document.querySelector('.application').classList.contains('expanded-mode')`);
 assert.equal(await evaluate(`document.querySelector('.fullscreen-button').getAttribute('aria-pressed')`),'true');
 await press('KeyL','l');await until(`document.querySelector('.language-menu-toggle').getAttribute('aria-expanded')==='true'`);
 await press('Escape','Escape');await until(`document.querySelector('.language-menu-toggle').getAttribute('aria-expanded')==='false'`);
 assert.equal(await evaluate(`document.querySelector('.application').classList.contains('expanded-mode')`),true,'Escape closes language options before leaving expanded view');
 await press('Escape','Escape');await until(`!document.querySelector('.application').classList.contains('expanded-mode')`);
 const soundBeforeShortcut=await evaluate(`document.querySelector('.sound-button').getAttribute('aria-pressed')`);
 await press('KeyZ','z');await until(`document.querySelector('.sound-button').getAttribute('aria-pressed')!=='${soundBeforeShortcut}'`);
 await press('KeyZ','z');await until(`document.querySelector('.sound-button').getAttribute('aria-pressed')==='${soundBeforeShortcut}'`);
 await screenshot('desktop.png');
 await delay(1200);
 assert.equal(await evaluate(`document.querySelector('.game-hud span:last-child b').textContent`),'6:00','The loading picture must not start the clock');
 const startPoint=await evaluate(`(()=>{const r=document.querySelector('.title-screen').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 await call('Input.dispatchMouseEvent',{type:'mousePressed',...startPoint,button:'left',clickCount:1});
 await call('Input.dispatchMouseEvent',{type:'mouseReleased',...startPoint,button:'left',clickCount:1});
 await until(`document.querySelector('canvas').dataset.state==='playing'`);
 const pixels=await evaluate(`Array.from(document.querySelector('canvas').getContext('2d').getImageData(0,0,240,176).data).filter((v,i)=>i%4!==3&&v>0).length`);assert.ok(pixels>1000);
 await call('Input.dispatchKeyEvent',{type:'keyDown',code:'ArrowRight',key:'ArrowRight'});await call('Input.dispatchKeyEvent',{type:'keyUp',code:'ArrowRight',key:'ArrowRight'});
 await delay(1200);assert.notEqual(await evaluate(`document.querySelector('.game-hud span:last-child b').textContent`),'6:00');
 await call('Input.dispatchKeyEvent',{type:'keyDown',code:'KeyP',key:'p'});await until(`document.querySelector('.overlay h2')?.textContent==='PAUZA'`);
 await screenshot('playing-paused.png');
 await evaluate(`document.querySelector('.primary').click()`);await until(`!document.querySelector('.overlay')`);
 await evaluate(`document.querySelector('.restart-button').click()`);await until(`document.querySelector('.game-hud span:last-child b').textContent==='6:00'`);
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await call('Emulation.setTouchEmulationEnabled',{enabled:true});
 assert.equal(await evaluate(`getComputedStyle(document.querySelector('.touch-controls')).display`),'flex');
 assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),true);
 await evaluate(`document.querySelector('.pause-button').click()`);await screenshot('mobile.png');
 await call('Page.reload');
 await until(titleReady);
 await screenshot('mobile-title.png');
 const touchPoint=await evaluate(`(()=>{const r=document.querySelector('.title-screen').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touchPoint]});
 await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await until(`document.querySelector('canvas').dataset.state==='playing'`);
 await evaluate(`navigator.serviceWorker.ready.then(()=>true)`);await until('!!navigator.serviceWorker.controller');
 await call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await call('Page.reload');
 await until(titleReady);
 assert.equal(await evaluate(`document.querySelector('.status')`),null,'The header status text and dot are removed');
 await evaluate(`document.querySelector('.title-screen').focus()`);
 await call('Input.dispatchKeyEvent',{type:'keyDown',code:'Space',key:' '});
 await call('Input.dispatchKeyEvent',{type:'keyUp',code:'Space',key:' '});
 await until(`document.querySelector('canvas').dataset.state==='playing'`);
 assert.equal(await evaluate(`document.querySelector('.mushroom-count b').textContent`),'0');
 assert.equal(await evaluate(`document.querySelector('.screen-bottom')`),null);
 assert.equal(await evaluate(`document.querySelector('.sector-toggle').textContent`),'Sektor');
 assert.equal(await evaluate(`document.querySelector('.notice').textContent.includes('Nejdřív')`),false,'Starting with space must not also fire');
 assert.equal(await evaluate(`navigator.onLine`),false);
 const cacheNames=await evaluate(`caches.keys()`);assert.ok(cacheNames.some(n=>n.startsWith('flappy-pmd85-')));
 // A notice already on screen must translate immediately, without a new game.
 await evaluate(`document.querySelector('.fire').click()`);
 await until(`document.querySelector('.notice').textContent.includes('Nejdřív')`);
 await chooseLanguage('en');
 await until(`document.documentElement.lang==='en' && document.querySelector('.notice').textContent.includes('Collect a mushroom')`);
 assert.equal(await evaluate(`document.querySelector('.title-screen')===null`),true,'Switching language must preserve the game');
 assert.match(await evaluate(`document.querySelector('canvas').getAttribute('aria-label')`),/Game board/);
 assert.match(await evaluate(`document.querySelector('meta[name="description"]').content`),/Two hundred/);
 assert.match(await evaluate(`document.querySelector('#pwa-manifest').getAttribute('href')`),/manifest.en.webmanifest/);
 await call('Input.dispatchKeyEvent',{type:'keyDown',code:'KeyP',key:'p'});
 await call('Input.dispatchKeyEvent',{type:'keyUp',code:'KeyP',key:'p'});
 await until(`document.querySelector('.overlay h2')?.textContent==='PAUSED'`);
 await chooseLanguage('cs');
 await until(`document.querySelector('.overlay h2')?.textContent==='PAUZA'`);
 assert.match(await evaluate(`document.querySelector('.notice').textContent`),/Nejdřív/);
 for(const language of ['cs','en']){
  await chooseLanguage(language);
  await until(`document.documentElement.lang==='${language}'`);
  for(const width of [320,390,768,1440]){
   await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
   assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`${language}: overflow at ${width}px`);
  }
 }
 await screenshot('english.png');
 // Persist sound-on with a real pointer gesture, then verify its safe restoration.
 const soundEnabled=await evaluate(`document.querySelector('.sound-button').getAttribute('aria-pressed')==='true'`);
 async function clickSound(){
  const point=await evaluate(`(()=>{const button=document.querySelector('.sound-button');button.scrollIntoView({block:'center'});const r=button.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await call('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
 }
 if(soundEnabled)await clickSound();
 await clickSound();
 await until(`window.__flappyAudioContexts.length===1 && window.__flappyOscillators.length>0`);
 assert.equal(await evaluate(`localStorage.getItem('flappy.sound')`),'true');
 await call('Page.reload');
 await until(titleReady);
 assert.equal(await evaluate('document.documentElement.lang'),'en','Language must survive an offline reload');
 assert.equal(await evaluate('window.__flappyAudioContexts.length'),0,'Restored sound-on must wait for interaction');
 assert.match(await evaluate(`document.querySelector('.title-prompt').textContent`),/CLICK OR PRESS/);
 assert.match(await evaluate(`document.querySelector('.sound-button').getAttribute('aria-label')`),/Sound on/);
 assert.equal(await evaluate(`fetch(document.querySelector('#pwa-manifest').href).then(r=>r.json()).then(m=>m.lang)`),'en');
 // Space on a language button changes language without accidentally starting.
 await evaluate(`document.querySelector('.language-menu-toggle').click()`);
 await until(`document.querySelector('.language-menu-toggle').getAttribute('aria-expanded')==='true'`);
 await evaluate(`document.querySelector('[data-language="cs"]').focus()`);
 await call('Input.dispatchKeyEvent',{type:'keyDown',code:'Space',key:' '});
 await call('Input.dispatchKeyEvent',{type:'keyUp',code:'Space',key:' '});
 await until(`document.documentElement.lang==='cs'`);
 assert.equal(await evaluate(`!!document.querySelector('.title-screen')`),true);
 await chooseLanguage('en');await evaluate(`document.querySelector('.title-screen').focus()`);
 await call('Input.dispatchKeyEvent',{type:'keyDown',code:'Space',key:' '});
 await call('Input.dispatchKeyEvent',{type:'keyUp',code:'Space',key:' '});
 await until(`document.querySelector('canvas').dataset.state==='playing' && window.__flappyAudioContexts.length===1 && window.__flappyOscillators.length>0`);
 await clickSound();
 await until(`document.querySelector('.sound-button').getAttribute('aria-pressed')==='false'`);
 assert.equal(await evaluate(`localStorage.getItem('flappy.sound')`),'false');
 // Render every effect through real Web Audio and check the resulting samples.
 const audible=await evaluate(`(async()=>{
  const {GameAudio,effects}=await import('./src/audio.js');
  const results={};
  for(const name of Object.keys(effects)){
   const offline=new OfflineAudioContext(1,44100,44100);
   const adapter={state:'running',currentTime:0,destination:offline.destination,createOscillator:()=>offline.createOscillator(),createGain:()=>offline.createGain()};
   const audio=new GameAudio({createContext:()=>adapter});audio.setEnabled(true);await audio.play(name);
   const rendered=await offline.startRendering(),samples=rendered.getChannelData(0);
   let energy=0;for(const sample of samples)energy+=sample*sample;
   results[name]=Math.sqrt(energy/samples.length);
  }
  return results;
 })()`);
 assert.ok(Object.values(audible).every(rms=>rms>.0001),'Every effect must produce non-silent audio');
 const mushrooms=await evaluate(`(async()=>{
  const {Game}=await import('./src/engine.js');const {render}=await import('./src/render.js');
  const board=document.createElement('canvas');board.width=240;board.height=200;
  const ctx=board.getContext('2d'),strip=document.createElement('canvas');strip.width=960;strip.height=480;
  const preview=strip.getContext('2d');preview.imageSmoothingEnabled=false;
  const game=new Game({walls:[],objects:[{type:1,x:3,y:1},{type:1,x:4,y:1}]});
  const counts=[];
  function snapshot(index){render(ctx,game);const pixels=ctx.getImageData(72,16,90,8).data;counts.push(Array.from(pixels).filter((v,i)=>i%4===0&&v>0).length);preview.drawImage(board,0,0,240,24,0,index*96,960,96)}
  snapshot(0);game.move(1,0);snapshot(1);game.move(1,0);snapshot(2);game.fire();snapshot(3);game.fire();snapshot(4);
  return {counts,image:strip.toDataURL()};
 })()`);
 assert.deepEqual(mushrooms.counts,[0,24,48,24,0],'Collecting and firing must add/remove mushroom icons below SECTOR');
 fs.writeFileSync('test-results/mushroom-hud.png',Buffer.from(mushrooms.image.split(',')[1],'base64'));
 const crushSequence=await evaluate(`(async()=>{
  const {Game,CRUSH_TICKS}=await import('./src/engine.js');
  const {render,HUD_HEIGHT,CANVAS_HEIGHT}=await import('./src/render.js');
  const scene=document.createElement('canvas');scene.width=240;scene.height=CANVAS_HEIGHT;
  const strip=document.createElement('canvas');strip.width=288;strip.height=224;
  const ctx=strip.getContext('2d');ctx.imageSmoothingEnabled=false;
  const g=new Game({walls:[],objects:[{type:3,x:5,y:1},{type:5,x:5,y:3}]});
  function snapshot(index){render(scene.getContext('2d'),g);ctx.drawImage(scene,24,HUD_HEIGHT,24,56,index*96,0,96,224)}
  snapshot(0);g.tick();snapshot(1);
  const corpseVisible=g.corpses.length===1&&g.rocks[0].y===2;
  for(let i=0;i<CRUSH_TICKS;i++)g.tick();snapshot(2);
  return {image:strip.toDataURL(),corpseVisible,continued:g.corpses.length===0&&g.rocks[0].y>2};
 })()`);
 assert.equal(crushSequence.corpseVisible,true);assert.equal(crushSequence.continued,true);
 fs.writeFileSync('test-results/crush-sequence.png',Buffer.from(crushSequence.image.split(',')[1],'base64'));
 // Exercise the real life-loss flow without a test-only application API.
 await evaluate(`document.querySelector('.restart-button').click()`);
 await until(`document.querySelector('canvas').dataset.state==='entering'`);
 assert.equal(await evaluate(`document.querySelector('canvas').height`),200);
 assert.equal(await evaluate(`document.querySelector('.game-hud').getBoundingClientRect().width<=1`),true,'The DOM status summary must not duplicate the canvas header');
 await evaluate(`document.querySelector('.pause-button').click()`);
 await until(`document.querySelector('canvas').dataset.state==='paused'`);
 const pausedEntry=await evaluate(`document.querySelector('canvas').toDataURL()`);
 await delay(300);
 assert.equal(await evaluate(`document.querySelector('canvas').toDataURL()`),pausedEntry,'Pause must freeze entry and its gate');
 await evaluate(`document.querySelector('.primary').click()`);
 await until(`document.querySelector('canvas').dataset.state==='playing'`);
 await screenshot('integrated-hud.png');
 const previousLives=await evaluate(`Number(document.querySelector('.lives').textContent)`);
 // Scene 1: walk around the first platform into the ghost on the left.
 for(const code of ['ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowDown','ArrowDown','ArrowDown','ArrowDown','ArrowLeft','ArrowLeft','ArrowLeft']){
  if(await evaluate(`document.querySelector('canvas').dataset.state!=='playing'`))break;
  await call('Input.dispatchKeyEvent',{type:'keyDown',code,key:code});await call('Input.dispatchKeyEvent',{type:'keyUp',code,key:code});
 }
 await until(`document.querySelector('canvas').dataset.state==='dead'`);
 assert.equal(await evaluate(`Number(document.querySelector('.lives').textContent)`),previousLives-1);
 assert.equal(await evaluate(`document.querySelector('.overlay')===null`),true,'A remaining life must re-enter automatically');
 await screenshot('player-crushed.png');
 await press('KeyP','p');await until(`document.querySelector('canvas').dataset.state==='paused'`);
 const pausedDeath=await evaluate(`document.querySelector('canvas').toDataURL()`);await delay(850);
 assert.equal(await evaluate(`document.querySelector('canvas').toDataURL()`),pausedDeath,'Pause must freeze the flattened player and re-entry delay');
 await press('KeyP','p');await until(`document.querySelector('canvas').dataset.state==='dead'`);
 await until(`document.querySelector('canvas').dataset.state==='entering'`);
 await delay(270);await screenshot('life-entry.png');
 await until(`document.querySelector('canvas').dataset.state==='playing'`);
 assert.equal(await evaluate(`Number(document.querySelector('.lives').textContent)`),previousLives-1,'One death must consume exactly one life');
 assert.equal(await evaluate(`document.querySelector('.game-hud span:last-child b').textContent`),'6:00');
 // Expanding and global settings must preserve a live game at every tested size.
 await press('KeyF','f');await until(`document.querySelector('.application').classList.contains('expanded-mode')`);
 for(const [width,height,coarse]of [[1440,1100,false],[390,844,true],[320,568,true],[844,390,true]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:coarse});
  await call('Emulation.setTouchEmulationEnabled',{enabled:coarse});
  await delay(150);
  assert.equal(await evaluate(`(()=>{const r=document.querySelector('.machine').getBoundingClientRect();return r.top>=(document.querySelector('.application').classList.contains('mobile-landscape')?0:63) && r.bottom<=innerHeight && r.left>=0 && r.right<=innerWidth})()`),true,`Expanded game must fit ${width}x${height}`);
  assert.equal(await evaluate(`(()=>{const r=document.querySelector('.global-controls').getBoundingClientRect();return r.top>=0&&r.right<=innerWidth})()`),true);
 }
 await screenshot('expanded-mobile.png');
 await press('KeyL','l');await until(`document.querySelector('canvas').dataset.state==='paused'`);
 const settingsPause=await evaluate(`document.querySelector('canvas').toDataURL()`);await delay(200);
 assert.equal(await evaluate(`document.querySelector('canvas').toDataURL()`),settingsPause,'Language choices must pause the active game');
 await press('Escape','Escape');await until(`document.querySelector('canvas').dataset.state==='playing'`);
 await press('KeyF','f');await until(`!document.querySelector('.application').classList.contains('expanded-mode')`);
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await call('Emulation.setTouchEmulationEnabled',{enabled:false});
 await evaluate(`document.querySelector('.restart-button').click()`);
 await until(`document.querySelector('canvas').dataset.state==='playing'`);
 // The final life must end the game instead of starting another entry.
 for(let remaining=previousLives-1;remaining>0;remaining--){
  for(const code of ['ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowDown','ArrowDown','ArrowDown','ArrowDown','ArrowLeft','ArrowLeft','ArrowLeft']){
   if(await evaluate(`document.querySelector('canvas').dataset.state!=='playing'`))break;
   await call('Input.dispatchKeyEvent',{type:'keyDown',code,key:code});await call('Input.dispatchKeyEvent',{type:'keyUp',code,key:code});
  }
  await until(`document.querySelector('canvas').dataset.state==='dead'`);
  assert.equal(await evaluate(`Number(document.querySelector('.lives').textContent)`),remaining-1);
  if(remaining===1){
   assert.equal(await evaluate(`document.querySelector('.overlay')===null`),true,'The final crushed player must be visible before game over');
   await delay(200);assert.equal(await evaluate(`document.querySelector('.overlay')===null`),true);
  }
  if(remaining>1)await until(`document.querySelector('canvas').dataset.state==='playing'`);
 }
 await until(`document.querySelector('.overlay h2')?.textContent==='GAME OVER'`);
 await delay(1000);assert.equal(await evaluate(`document.querySelector('canvas').dataset.state`),'dead');
 await evaluate(`document.querySelector('.primary').click()`);
 await until(`document.querySelector('canvas').dataset.state==='entering'`);
 assert.equal(await evaluate(`Number(document.querySelector('.lives').textContent)`),5);
 await until(`document.querySelector('canvas').dataset.state==='playing'`);
 assert.deepEqual(errors,[]);console.log('Browser OK: icon toolbar, L/Z/F/Escape shortcuts, keyboard language menu, expanded layouts, preserved game state, integrated HUD, life entry, CS/EN, offline operation, sound and crushed enemies.');
}finally{if(instrumentId)await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:instrumentId}).catch(()=>{});await call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1}).catch(()=>{});if(saved)await evaluate(`localStorage.clear();for(const [key,value]of Object.entries(${saved}))localStorage.setItem(key,value)`).catch(()=>{});ws.close()}
