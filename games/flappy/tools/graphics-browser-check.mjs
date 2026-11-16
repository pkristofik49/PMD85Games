// Real browser rendering, storage and offline checks using only Node and Chrome CDP.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const pages=await(await fetch('http://127.0.0.1:9222/json')).json();
const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
let id=0,saved;const pending=new Map(),errors=[];
ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)});
function call(method,params={}){return new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}))})}
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(80)}throw Error('Timed out: '+expression)}
async function key(code,key=code){const native=key==='Enter'?{text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13}:{};await call('Input.dispatchKeyEvent',{type:'keyDown',code,key,...native});await call('Input.dispatchKeyEvent',{type:'keyUp',code,key})}
async function choose(mode){
 if(!await evaluate(`document.querySelector('.graphics-menu-toggle').getAttribute('aria-expanded')==='true'`))await key('KeyG','g');
 await until(`document.querySelector('.graphics-menu-toggle').getAttribute('aria-expanded')==='true'`);
 await until(`!document.querySelector('button[data-graphics="${mode}"]').disabled`);
 await evaluate(`document.querySelector('button[data-graphics="${mode}"]').click()`);
 await until(`document.querySelector('canvas').dataset.graphics==='${mode}' && document.querySelector('.graphics-menu-toggle').getAttribute('aria-expanded')==='false'`);
}
const width=()=>evaluate(`document.querySelector('canvas').width`);
const board=()=>evaluate(`document.querySelector('canvas').toDataURL()`);
function saveImage(name,data){fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/'+name,Buffer.from(data.split(',')[1],'base64'))}
try{
 await call('Runtime.enable');await call('Page.enable');await call('Network.enable');await call('Network.setBypassServiceWorker',{bypass:false});
 const url=process.argv[2]||'http://127.0.0.1:4173/Flappy/';
 await call('Storage.clearDataForOrigin',{origin:new URL(url).origin,storageTypes:'service_workers,cache_storage'});
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await call('Emulation.setTouchEmulationEnabled',{enabled:false});
 await call('Page.navigate',{url});await until(`!!document.querySelector('.graphics-menu-toggle') && !document.querySelector('#app').hasAttribute('v-cloak')`);
 saved=await evaluate(`JSON.stringify({...localStorage})`);
 await evaluate(`localStorage.setItem('flappy.graphics','mono');localStorage.setItem('flappy.language','cs');localStorage.setItem('flappy-pmd85-progress-v1',JSON.stringify({scene:1,unlocked:1}))`);
 await call('Page.reload');await until(`document.querySelector('canvas')?.dataset.graphics==='mono'`);
 const title=await evaluate(`document.querySelector('.title-screen img').getAttribute('src')`);
 assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('#graphics-options button'),b=>b.textContent.trim())`),['PMD 85-1','PMD-85-3','Sharp MZ-800','MSX','Nintendo NES','PC']);
 await key('KeyG','g');await until(`document.activeElement?.dataset.graphics==='mono'`);
 await key('ArrowDown');await key('Enter');await until(`document.querySelector('canvas').dataset.graphics==='color'`);
 assert.equal(await width(),240);assert.equal(await evaluate(`document.querySelector('canvas').dataset.state`),'ready');
 assert.notEqual(await evaluate(`document.querySelector('.title-screen img').getAttribute('src')`),title,'PMD-85-3 uses its remaster title');
 for(const [mode,naturalWidth]of [['color',576],['sharp',320],['msx',256],['nes',256],['modern',1280]]){
  await choose(mode);await until(`document.querySelector('.title-screen img').complete && document.querySelector('.title-screen img').naturalWidth===${naturalWidth}`);
  assert.equal(await width(),mode==='modern'?1280:mode==='color'?240:320);assert.equal(await evaluate(`document.querySelector('canvas').dataset.state`),'ready');
  const clip=await evaluate(`(()=>{const r=document.querySelector('.viewport').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,scale:1}})()`);
  saveImage('title-'+mode+'.png',`data:image/png;base64,${(await call('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true})).data}`);
 }
 await choose('mono');await evaluate(`document.querySelector('.title-screen').focus()`);await key('Space',' ');
 await until(`document.querySelector('canvas').dataset.state==='playing'`);await key('KeyP','p');
 await until(`document.querySelector('canvas').dataset.state==='paused'`);
 const before=await board(),time=await evaluate(`document.querySelector('.game-hud span:last-child b').textContent`);
 for(const mode of ['sharp','msx','nes']){await choose(mode);assert.equal(await width(),320);saveImage('board-'+mode+'.png',await board());assert.equal(await evaluate(`document.querySelector('canvas').dataset.state`),'paused')}
 await choose('color');assert.notEqual(await board(),before);saveImage('original-colour.png',await board());
 await choose('modern');assert.equal(await width(),1280);assert.equal(await evaluate(`document.querySelector('canvas').height`),800);
 saveImage('modern-board.png',await board());
 const atlas=await evaluate(`import('./src/graphics.js').then(async m=>{const a=await m.loadModernSprites(),c=document.createElement('canvas');c.width=a.image.naturalWidth;c.height=a.image.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(a.image,0,0);const alphas=[];for(let y=0;y<4;y++)for(let x=0;x<4;x++)alphas.push(ctx.getImageData(Math.floor(x*c.width/4),Math.floor(y*c.height/4),1,1).data[3]);return{width:c.width,height:c.height,frames:a.frames,alphas}})`);
 assert.equal(atlas.frames.length,16);assert.ok(atlas.frames.every(f=>f.width>100&&f.height>100&&f.x>=0&&f.y>=0&&f.x+f.width<=atlas.width&&f.y+f.height<=atlas.height));
 assert.ok(atlas.alphas.every(alpha=>alpha===0),'Sprite gutters must be transparent without pale rectangles');
 const walk=await evaluate(`(async()=>{
  const {loadModernSprites,modernSprite}=await import('./src/graphics.js'),atlas=await loadModernSprites();
  const sheet=document.createElement('canvas');sheet.width=768;sheet.height=192;const ctx=sheet.getContext('2d');ctx.fillStyle='#121c29';ctx.fillRect(0,0,768,192);
  const frames=[],cell=document.createElement('canvas');cell.width=64;cell.height=64;
  for(let i=0;i<16;i++){modernSprite(ctx,atlas,16+i,(i%8)*96+16,Math.floor(i/8)*96+16,64,64);const c=cell.getContext('2d');c.clearRect(0,0,64,64);modernSprite(c,atlas,16+i,0,0,64,64);frames.push(cell.toDataURL())}
  return{image:sheet.toDataURL(),left:new Set(frames.slice(0,8)).size,right:new Set(frames.slice(8)).size,crops:atlas.walk.frames};
 })()`);
 assert.equal(walk.left,8);assert.equal(walk.right,8);
 assert.equal(new Set(walk.crops.map(f=>f.width+','+f.height)).size,1,'The walk cycle must keep a fixed crop to avoid body-size wobble');
 saveImage('mole-walk-cycle.png',walk.image);
 const deaths=await evaluate(`(async()=>{
  const {Game}=await import('./src/engine.js'),{render,HUD_HEIGHT}=await import('./src/render.js'),{loadModernSprites}=await import('./src/graphics.js');
  const atlas=await loadModernSprites(),results=[],strip=document.createElement('canvas');strip.width=288;strip.height=320;
  const preview=strip.getContext('2d');preview.imageSmoothingEnabled=false;
  for(const [column,mode]of ['mono','color','modern'].entries())for(const [row,cause]of ['enemy','falling'].entries()){
   const game=new Game({walls:[],objects:cause==='enemy'?[{type:5,x:3,y:1}]:[{type:3,x:5,y:1}]});
   if(cause==='enemy')game.move(1,0);else{game.player.x=5;game.player.y=3;game.tick()}
   const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),scale=mode==='modern'?4:1,scaleX=mode==='modern'?16/3:1;
   render(ctx,game,undefined,undefined,null,{mode,atlas});
   const x=game.player.x*6,y=HUD_HEIGHT+game.player.y*8;
   const shown=ctx.getImageData(x*scaleX,y*scale,12*scaleX,16*scale).data;
   preview.drawImage(canvas,(x-6)*scaleX,(y-16)*scale,24*scaleX,40*scale,column*96,row*160,96,160);
   render(ctx,game,undefined,undefined,null,{mode,atlas,showDeadPlayer:false});
   const hidden=ctx.getImageData(x*scaleX,y*scale,12*scaleX,16*scale).data;
   let upper=0,lower=0;for(let i=0;i<shown.length;i++)if(shown[i]!==hidden[i]){if(i<12*scaleX*8*scale*4)upper++;else lower++}
   results.push({mode,cause,reason:game.reason,upper,lower});
  }
  return{results,image:strip.toDataURL()};
 })()`);
 assert.ok(deaths.results.every(r=>r.reason==='death.'+r.cause&&r.upper===0&&r.lower>0),'Both death causes must show only the flattened bottom half in every style');
 saveImage('player-deaths-all-styles.png',deaths.image);
 const animation=await evaluate(`(async()=>{
  const {Game}=await import('./src/engine.js'),{Motion}=await import('./src/motion.js'),{render}=await import('./src/render.js'),{loadModernSprites}=await import('./src/graphics.js');
  const atlas=await loadModernSprites(),game=new Game({walls:[],objects:[{type:2,x:12,y:1},{type:3,x:9,y:1},{type:4,x:15,y:5},{type:5,x:20,y:5}]});
  game.ammo=1;game.fire();game.ticks=4;game.random=()=>1;
  const motion=new Motion();motion.reset(game);game.move(1,0);game.tick();motion.capture(game);
  const before=JSON.stringify(game),objects=[game.player,...game.rocks,...game.enemies,...game.shots];
  const board=document.createElement('canvas'),ctx=board.getContext('2d'),strip=document.createElement('canvas');strip.width=960;strip.height=200;
  const images=[];let mid=[];
  for(const [i,delta]of [0,60,120].entries()){
   motion.advance(delta);render(ctx,game,undefined,undefined,null,{mode:'modern',atlas,motion});images.push(board.toDataURL());
   strip.getContext('2d').drawImage(board,i*320,0,320,200);
   if(i===1)mid=objects.map(o=>motion.position(o));
  }
  return{image:strip.toDataURL(),unique:new Set(images).size,mid,unchanged:JSON.stringify(game)===before};
 })()`);
 assert.equal(animation.unique,3);assert.equal(animation.unchanged,true);
 assert.ok(animation.mid.every(p=>p.moving&&(!Number.isInteger(p.x)||!Number.isInteger(p.y))),'Player, crystal, stone, frog, ghost and shot must all render between grid cells');
 saveImage('smooth-motion.png',animation.image);
 const breaking=await evaluate(`(async()=>{
  const {Game}=await import('./src/engine.js'),{render,HUD_HEIGHT}=await import('./src/render.js'),{Motion}=await import('./src/motion.js'),{sprites}=await import('./assets/game-data.js'),{loadModernSprites}=await import('./src/graphics.js');
  const atlas=await loadModernSprites(),strip=document.createElement('canvas');strip.width=288;strip.height=512;const preview=strip.getContext('2d');preview.imageSmoothingEnabled=false;
  const results=[],restored=[];
  for(const [col,mode]of ['mono','color','modern'].entries()){
   const g=new Game({walls:[[5,1]],objects:[{type:3,x:3,y:1}]}),motion=new Motion();motion.reset(g);
   const board=document.createElement('canvas'),ctx=board.getContext('2d'),scale=mode==='modern'?4:1,scaleX=mode==='modern'?16/3:1,images=[];
   function snapshot(row){render(ctx,g,undefined,undefined,null,{mode,atlas,motion});images.push(board.toDataURL());preview.drawImage(board,18*scaleX,(HUD_HEIGHT+8)*scale,12*scaleX,16*scale,col*96,row*128,96,128)}
   snapshot(0);g.move(1,0);motion.capture(g);g.tick();motion.advance(120);motion.capture(g);snapshot(1);
   for(let i=0;i<2;i++){g.tick();motion.advance(120);motion.capture(g)}snapshot(2);
   for(let i=0;i<3;i++){g.tick();motion.advance(120);motion.capture(g)}snapshot(3);
   results.push({unique:new Set(images).size,cleared:g.debris.length===0});
   if(mode!=='modern'){
    const target=new Game({walls:[],objects:[{type:2,x:5,y:3}]});render(ctx,target,undefined,undefined,null,{mode});
    const pixels=ctx.getImageData(30,HUD_HEIGHT+24,12,16).data;let matches=true;
    for(let row=0;row<16;row++){const bits=sprites.egg[row*2]|(sprites.egg[row*2+1]<<6);let first=0,last=11;if(bits){while(!(bits&(1<<first)))first++;while(!(bits&(1<<last)))last--}
     for(let x=0;x<12;x++)if((pixels[(row*12+x)*4]>0)!==Boolean(bits&&x>=first&&x<=last))matches=false;
    }restored.push(matches);
   }
  }
  return{results,restored,image:strip.toDataURL()};
 })()`);
 assert.ok(breaking.results.every(r=>r.unique===4&&r.cleared),'Every mode must show both crumble phases and clear all debris');
 assert.deepEqual(breaking.restored,[true,true],'Both PMD modes must restore the previous target silhouette and fill');
 saveImage('stone-breaking.png',breaking.image);
 assert.equal(await evaluate(`document.querySelector('canvas').dataset.state`),'paused');
 assert.equal(await evaluate(`document.querySelector('.game-hud span:last-child b').textContent`),time);
 await choose('mono');assert.equal(await width(),240);assert.equal(await board(),before,'Changing all three styles must preserve the paused world exactly');
 await key('KeyG','g');await until(`document.querySelector('.graphics-menu-toggle').getAttribute('aria-expanded')==='true'`);
 await key('KeyL','l');await until(`document.activeElement?.dataset.language==='cs'`);
 assert.equal(await evaluate(`document.querySelector('.graphics-menu-toggle').getAttribute('aria-expanded')`),'false');
 await key('KeyG','g');await until(`document.activeElement?.dataset.graphics==='mono'`);await key('Escape');
 await key('KeyP','p');await until(`document.querySelector('canvas').dataset.state==='playing'`);
 await key('KeyG','g');await until(`document.querySelector('canvas').dataset.state==='paused'`);
 const frozen=await board();await delay(250);assert.equal(await board(),frozen);
 await key('Escape');await until(`document.querySelector('canvas').dataset.state==='playing'`);
 await choose('modern');await evaluate(`navigator.serviceWorker.ready`);await until(`!!navigator.serviceWorker.controller`);
 await call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await call('Page.reload');
 await until(`!!document.querySelector('.title-screen') && document.querySelector('canvas')?.dataset.graphics==='modern' && document.querySelector('canvas').width===1280`);
 for(const mode of ['sharp','msx','nes','color','mono','modern']){await choose(mode);assert.equal(await width(),mode==='modern'?1280:['sharp','msx','nes'].includes(mode)?320:240);await until(`document.querySelector('.title-screen img').complete && document.querySelector('.title-screen img').naturalWidth>0`)}
 await evaluate(`document.querySelector('.title-screen').focus()`);await key('Space',' ');await until(`document.querySelector('canvas').dataset.state==='playing'`);await delay(150);
 await key('ArrowRight');
 const liveFrames=await evaluate(`new Promise(resolve=>{const frames=[],crop=document.createElement('canvas');crop.width=128;crop.height=64;const ctx=crop.getContext('2d');function sample(){ctx.drawImage(document.querySelector('canvas'),32,128,128,64,0,0,128,64);frames.push(crop.toDataURL());if(frames.length===8)resolve(new Set(frames).size);else requestAnimationFrame(sample)}requestAnimationFrame(sample)})`);
 assert.ok(liveFrames>=4,'A single live player step must paint multiple requestAnimationFrame frames');
 await key('KeyP','p');await until(`document.querySelector('canvas').dataset.state==='paused'`);
 const pausedAnimation=await board();await delay(220);assert.equal(await board(),pausedAnimation,'Modern motion and hovering must stop during pause');
 const progressBeforeTitle=await evaluate(`JSON.parse(localStorage.getItem('flappy-pmd85-progress-v1')).unlocked`);
 await evaluate(`document.querySelector('.machine-top').click()`);await until(`document.querySelector('canvas').dataset.state==='ready' && !!document.querySelector('.title-screen')`);
 assert.equal(await evaluate(`document.querySelector('.lives').textContent`),'5');
 assert.equal(await evaluate(`document.querySelector('.game-hud span:last-child b').textContent`),'6:00');
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('flappy-pmd85-progress-v1')).unlocked`),progressBeforeTitle);
 await delay(200);assert.equal(await evaluate(`document.querySelector('canvas').dataset.state`),'ready','Returning to the title must stop automatic play');
 await key('Space',' ');await until(`document.querySelector('canvas').dataset.state==='playing'`);
 await evaluate(`document.querySelector('.machine-top').focus()`);await key('Enter');await until(`document.querySelector('canvas').dataset.state==='ready'`);
 await key('Space',' ');await until(`document.querySelector('canvas').dataset.state==='playing'`);await key('KeyP','p');
 await call('Emulation.setDeviceMetricsOverride',{width:320,height:568,deviceScaleFactor:1,mobile:true});await call('Emulation.setTouchEmulationEnabled',{enabled:true});
 assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),true,'Four toolbar icons must fit on a 320px screen');
 await key('KeyF','f');await key('KeyG','g');await until(`document.querySelector('.graphics-menu-toggle').getAttribute('aria-expanded')==='true'`);
 assert.equal(await evaluate(`(()=>{const r=document.querySelector('#graphics-options').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})()`),true);
 await delay(200);const mobile=await call('Page.captureScreenshot',{format:'png'});saveImage('graphics-menu-mobile.png',`data:image/png;base64,${mobile.data}`);
 for(const mode of ['sharp','msx','nes'])for(const [width,height]of [[320,568],[844,390]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await choose(mode);await delay(120);
  assert.equal(await evaluate(`(()=>{const r=document.querySelector('.machine').getBoundingClientRect();return r.top>=(document.querySelector('.application').classList.contains('mobile-landscape')?0:63) && r.bottom<=innerHeight+1 && r.left>=0 && r.right<=innerWidth})()`),true,mode+' expanded viewport fit');
 }
 assert.deepEqual(errors,[]);console.log('Graphics browser OK: eight walk frames per side, clickable title header, all six modes, keyboard menu, exact game-state preservation, 1280×800 PC rendering, stored preference, offline switching and 320px toolbar.');
}finally{
 await call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1}).catch(()=>{});
 if(saved)await evaluate(`localStorage.clear();Object.entries(JSON.parse(${JSON.stringify(saved)})).forEach(([k,v])=>localStorage.setItem(k,v))`).catch(()=>{});
 ws.close();
}
