// Touch input, orientation, pause and password audio checks. No browser packages.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const pages=await(await fetch('http://127.0.0.1:9222/json')).json();
const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0,saved;const pending=new Map(),errors=[];
ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)});
const call=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}))});
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(80)}throw Error('Timed out: '+expression)}
async function point(selector){return evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center',inline:'nearest'});const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`)}
async function tap(selector){const p=await point(selector);await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
async function key(code,key=code){const native=key==='Enter'?{text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13}:{};await call('Input.dispatchKeyEvent',{type:'keyDown',code,key,...native});await call('Input.dispatchKeyEvent',{type:'keyUp',code,key})}
async function size(width,height){await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await call('Emulation.setTouchEmulationEnabled',{enabled:true});await delay(180)}
async function screenshot(name){const r=await call('Page.captureScreenshot',{format:'png'});fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/'+name,Buffer.from(r.data,'base64'))}
try{
 await call('Runtime.enable');await call('Page.enable');await call('Network.enable');await call('Network.clearBrowserCache');
 const url=process.argv[2]||'http://127.0.0.1:4173/Flappy/';
 await call('Storage.clearDataForOrigin',{origin:new URL(url).origin,storageTypes:'service_workers,cache_storage'});
 await size(390,844);await call('Page.navigate',{url});await until(`!!document.querySelector('.sector-toggle')&&!document.querySelector('#app').hasAttribute('v-cloak')`);
 saved=await evaluate(`JSON.stringify({...localStorage})`);
 await evaluate(`localStorage.setItem('flappy-pmd85-progress-v1',JSON.stringify({scene:1,unlocked:1}));localStorage.setItem('flappy.graphics','modern');localStorage.setItem('flappy.language','cs');localStorage.setItem('flappy.sound','true')`);
 await call('Page.reload');await delay(150);await until(`document.querySelector('.title-screen')&&document.querySelector('canvas').width===1280`);
 await evaluate(`import('./src/audio.js').then(({GameAudio})=>{window.__effects=[];const original=GameAudio.prototype.play;GameAudio.prototype.play=function(event){window.__effects.push(event);return original.call(this,event)}})`);
 assert.equal(await evaluate(`getComputedStyle(document.querySelector('.screen-wrap')).paddingLeft`),'3px');
 assert.equal(await evaluate(`document.querySelector('.viewport').getBoundingClientRect().width/document.querySelector('.machine').getBoundingClientRect().width>.9`),true);
 await tap('.title-screen');await until(`document.querySelector('canvas').dataset.state==='playing'`);
 assert.equal(await evaluate(`window.__effects.includes('start')`),true);
 await tap('canvas');await until(`document.querySelector('canvas').dataset.state==='paused'`);
 const alpha=await evaluate(`getComputedStyle(document.querySelector('.pause-overlay')).backgroundColor`);assert.match(alpha,/0\.45/);
 await screenshot('mobile-pause-portrait.png');
 await evaluate(`document.querySelector('.sector-toggle').click()`);await until(`!!document.querySelector('#sector-password')`);
 const before=await evaluate(`window.__effects.filter(e=>e==='start').length`);
 await evaluate(`document.querySelector('#sector-password').focus()`);await call('Input.insertText',{text:'xxxxx'});await key('Enter');
 await until(`document.querySelector('#sector-password').getAttribute('aria-invalid')==='true'`);
 assert.equal(await evaluate(`window.__effects.filter(e=>e==='start').length`),before);
 await evaluate(`document.querySelector('#sector-password').value='';document.querySelector('#sector-password').dispatchEvent(new Event('input',{bubbles:true}))`);await call('Input.insertText',{text:':beda'});await key('Enter');
 await until(`!document.querySelector('[data-sector="40"]').disabled&&window.__effects.filter(e=>e==='start').length===${before+1}`);
 assert.equal(await evaluate(`document.querySelector('canvas').dataset.state`),'paused');
 await tap('.sector-close');await tap('.sound-button');await evaluate(`document.querySelector('.sector-toggle').click()`);await until(`!!document.querySelector('#sector-password')`);
 await evaluate(`document.querySelector('#sector-password').focus()`);await call('Input.insertText',{text:'SHIBA'});await key('Enter');await until(`!document.querySelector('[data-sector="5"]').disabled`);
 assert.equal(await evaluate(`window.__effects.filter(e=>e==='start').length`),before+1,'Password audio respects mute');
 await tap('.sector-close');await tap('.primary');await until(`document.querySelector('canvas').dataset.state==='playing'`);
 const controls=await evaluate(`(()=>{const r=s=>document.querySelector(s).getBoundingClientRect(),u=r('.dpad .up'),d=r('.dpad .down'),l=r('.dpad .left'),rr=r('.dpad .right');return{cross:u.x===d.x&&l.y===rr.y&&u.y<l.y&&d.y>l.y,svg:document.querySelectorAll('.dpad button svg').length,text:Array.from(document.querySelectorAll('.touch-controls button'),b=>b.textContent.trim()).join(''),select:getComputedStyle(document.querySelector('.touch-controls')).userSelect,circle:getComputedStyle(document.querySelector('.fire')).borderRadius}})()`);
 assert.equal(controls.cross,true);assert.equal(controls.svg,4);assert.equal(controls.text,'');assert.equal(controls.select,'none');assert.equal(controls.circle,'50%');
 const p=await point('.dpad .right');await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await delay(900);await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.equal(await evaluate(`window.getSelection().toString()`),'');assert.equal(await evaluate(`document.querySelector('canvas').dataset.state`),'playing');
 await tap('canvas');await until(`document.querySelector('canvas').dataset.state==='paused'`);
 for(const [width,height]of [[844,390],[568,320]]){
  await size(width,height);await until(`document.querySelector('.application').classList.contains('mobile-landscape')`);
  for(const mode of ['mono','modern']){
   await evaluate(`document.querySelector('.graphics-menu-toggle').click()`);await until(`document.querySelector('.graphics-menu-toggle').getAttribute('aria-expanded')==='true'`);
   assert.equal(await evaluate(`(()=>{const r=document.querySelector('#graphics-options').getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight})()`),true,'Side menu stays on screen');
   await evaluate(`document.querySelector('[data-graphics="${mode}"]').click()`);await delay(180);
   const fit=await evaluate(`(()=>{const b=document.querySelector('.viewport').getBoundingClientRect(),t=document.querySelector('.global-controls').getBoundingClientRect(),d=document.querySelector('.dpad').getBoundingClientRect(),f=document.querySelector('.fire').getBoundingClientRect(),m=document.querySelector('.machine').getBoundingClientRect();return{height:b.height,inside:m.top>=0&&m.bottom<=innerHeight+1&&m.left>=0&&m.right<=innerWidth,side:t.left>=b.right&&d.right<=b.left&&f.left>=b.right,vertical:getComputedStyle(document.querySelector('.global-controls')).flexDirection==='column'}})()`);
   assert.equal(fit.inside,true,mode+' fits '+width);assert.equal(fit.side,true,mode+' controls do not overlap '+width);assert.equal(fit.vertical,true);assert.ok(fit.height>150);
  }
  await screenshot('mobile-landscape-'+width+'.png');
 }
 await key('KeyF','f');await delay(150);assert.equal(await evaluate(`document.querySelector('.application').classList.contains('expanded-mode')`),true);await key('Escape');
 await size(390,844);await until(`!document.querySelector('.application').classList.contains('mobile-landscape')`);
 assert.equal(await evaluate(`getComputedStyle(document.querySelector('.global-controls')).flexDirection`),'row');assert.equal(await evaluate(`getComputedStyle(document.querySelector('.wordmark')).display!=='none'`),true);
 assert.deepEqual(errors,[]);console.log('Mobile browser OK: start sound after passwords with mute respected, tap-to-pause, half-opacity pause, narrow portrait frame, SVG gamepad long press, side toolbar, menus and board fit in both orientations.');
}finally{
 if(saved)await evaluate(`localStorage.clear();Object.entries(JSON.parse(${JSON.stringify(saved)})).forEach(([k,v])=>localStorage.setItem(k,v))`).catch(()=>{});
 ws.close();
}
