// Real sector selection, input, pause and offline checks with native Chrome CDP.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const pages=await(await fetch('http://127.0.0.1:9222/json')).json();
const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0,saved;const pending=new Map(),errors=[];
ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)});
function call(method,params={}){return new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}))})}
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(80)}throw Error('Timed out: '+expression)}
async function key(code,key=code,extra={}){const native=key==='Enter'?{text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13}:{};await call('Input.dispatchKeyEvent',{type:'keyDown',code,key,...native,...extra});await call('Input.dispatchKeyEvent',{type:'keyUp',code,key,...extra})}
const state=()=>evaluate(`document.querySelector('canvas').dataset.state`);
async function open(){await evaluate(`document.querySelector('.sector-toggle').click()`);await until(`document.querySelectorAll('[data-sector]').length===200`)}
async function snapshot(name){const clip=await evaluate(`(()=>{const r=document.querySelector('.viewport').getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}})()`);const r=await call('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/'+name,Buffer.from(r.data,'base64'))}
try{
 await call('Runtime.enable');await call('Page.enable');await call('Network.enable');await call('Network.setBypassServiceWorker',{bypass:false});
 const url=process.argv[2]||'http://127.0.0.1:4173/Flappy/';
 await call('Storage.clearDataForOrigin',{origin:new URL(url).origin,storageTypes:'service_workers,cache_storage'});
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await call('Emulation.setTouchEmulationEnabled',{enabled:false});
 await call('Page.navigate',{url});await until(`!!document.querySelector('.sector-toggle')&&!document.querySelector('#app').hasAttribute('v-cloak')`);
 saved=await evaluate(`JSON.stringify({...localStorage})`);
 await evaluate(`localStorage.setItem('flappy-pmd85-progress-v1',JSON.stringify({scene:2,unlocked:3,bonus:[40,80,200]}));localStorage.setItem('flappy.language','cs');localStorage.setItem('flappy.graphics','mono')`);
 await call('Page.reload');await delay(150);await until(`document.querySelector('canvas')?.dataset.state==='ready'`);
 assert.equal(await evaluate(`document.querySelector('#scene')===null&&document.querySelector('.scene-picker')===null`),true);
 assert.equal(await evaluate(`document.querySelector('.sector-toggle').textContent`),'Sektor');
 await open();assert.equal(await state(),'ready');
 assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('[data-sector]:not(:disabled)'),b=>Number(b.dataset.sector))`),[1,2,3,40,80,200]);
 assert.equal(await evaluate(`document.querySelector('[data-sector="2"]').getAttribute('aria-current')`),'true');
 assert.equal(await evaluate(`getComputedStyle(document.querySelector('.sector-grid')).gridTemplateColumns.split(' ').length`),20);
 assert.equal(await evaluate(`getComputedStyle(document.querySelector('.sector-grid')).gridTemplateRows.split(' ').length`),10);
 await evaluate(`document.querySelector('[data-sector="4"]').click()`);assert.equal(await evaluate(`!!document.querySelector('.sector-overlay')`),true);
 await snapshot('sector-grid-desktop.png');await key('Escape');assert.equal(await state(),'ready');
 await evaluate(`document.querySelector('.title-screen').click()`);await until(`document.querySelector('canvas').dataset.state==='entering'`);await open();assert.equal(await state(),'paused');
 const entry=await evaluate(`document.querySelector('canvas').toDataURL()`);await delay(300);assert.equal(await evaluate(`document.querySelector('canvas').toDataURL()`),entry);
 await key('Escape');await until(`document.querySelector('canvas').dataset.state==='playing'`);
 await open();const frozen=await evaluate(`document.querySelector('canvas').toDataURL()`);await delay(250);assert.equal(await evaluate(`document.querySelector('canvas').toDataURL()`),frozen);
 await key('KeyP','p');await key('KeyR','r');assert.equal(await state(),'paused');assert.equal(await evaluate(`!!document.querySelector('.sector-overlay')`),true);
 await key('Home');assert.equal(await evaluate(`document.activeElement.dataset.sector`),'1');
 await key('End');assert.equal(await evaluate(`document.activeElement.dataset.sector`),'200');
 await key('ArrowUp');assert.equal(await evaluate(`document.activeElement.dataset.sector`),'80');
 await key('ArrowLeft');assert.equal(await evaluate(`document.activeElement.dataset.sector`),'40');
 await key('Enter');await until(`document.querySelector('canvas').dataset.state==='playing'&&!document.querySelector('.sector-overlay')`);
 assert.equal(await evaluate(`document.querySelector('.game-hud span:first-child b').textContent`),'040');
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('flappy-pmd85-progress-v1')).scene`),40);
 await key('KeyP','p');await open();await evaluate(`document.querySelector('.sector-close').click()`);assert.equal(await state(),'paused');
 await key('KeyF','f');await until(`document.querySelector('.application').classList.contains('expanded-mode')`);await open();
 await evaluate(`document.querySelector('.sector-close').focus()`);await key('Tab','Tab',{modifiers:8});assert.equal(await evaluate(`document.activeElement.className`),'password-submit');
 await key('Tab');assert.equal(await evaluate(`document.activeElement.className`),'sector-close');
 await key('Escape');assert.equal(await evaluate(`document.querySelector('.application').classList.contains('expanded-mode')`),true);
 await key('Escape');await until(`!document.querySelector('.application').classList.contains('expanded-mode')`);
 await evaluate(`document.querySelector('.language-menu-toggle').click()`);await until(`document.querySelector('[data-language="en"]').offsetParent!==null`);await evaluate(`document.querySelector('[data-language="en"]').click()`);
 assert.equal(await evaluate(`document.querySelector('.sector-toggle').textContent`),'Sector');
 await evaluate(`document.querySelector('.graphics-menu-toggle').click()`);await until(`!document.querySelector('[data-graphics="modern"]').disabled`);await evaluate(`document.querySelector('[data-graphics="modern"]').click()`);
 await call('Emulation.setDeviceMetricsOverride',{width:320,height:568,deviceScaleFactor:1,mobile:true});await call('Emulation.setTouchEmulationEnabled',{enabled:true});
 await open();assert.equal(await evaluate(`document.querySelector('#sector-title').textContent`),'Choose a sector');
 assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),true);
 assert.equal(await evaluate(`(()=>{const s=document.querySelector('.sector-scroll');return s.scrollWidth>s.clientWidth&&s.scrollHeight>s.clientHeight})()`),true,'Small screens scroll inside the overlay');
 await evaluate(`document.querySelector('[data-sector="200"]').scrollIntoView({block:'nearest',inline:'nearest'})`);await snapshot('sector-grid-mobile.png');
 const point=await evaluate(`(()=>{const r=document.querySelector('[data-sector="200"]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await until(`document.querySelector('canvas').dataset.state==='playing'&&document.querySelector('.game-hud span:first-child b').textContent==='200'`);
 await evaluate(`navigator.serviceWorker.ready`);
 if(!await evaluate(`!!navigator.serviceWorker.controller`)){await call('Page.reload');await delay(150);await until(`!!document.querySelector('.sector-toggle')&&!document.querySelector('#app').hasAttribute('v-cloak')`)}
 await until(`!!navigator.serviceWorker.controller`);
 await call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await call('Page.reload');await delay(150);await until(`document.querySelector('canvas')?.dataset.state==='ready'`);
 await open();assert.equal(await evaluate(`document.querySelector('[data-sector="200"]').disabled`),false);
 await evaluate(`document.querySelector('[data-sector="1"]').click()`);await until(`document.querySelector('canvas').dataset.state==='playing'`);
 assert.equal(await evaluate(`document.querySelector('.game-hud span:first-child b').textContent`),'001');
 assert.deepEqual(errors,[]);console.log('Sectors browser OK: 20×10 grid, locks, selected sector, frozen entry/play, keyboard navigation, focus trap, manual pause, fullscreen Escape, CS/EN, mobile touch, saved progress and offline selection.');
}finally{
 await call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1}).catch(()=>{});
 if(saved)await evaluate(`localStorage.clear();Object.entries(JSON.parse(${JSON.stringify(saved)})).forEach(([k,v])=>localStorage.setItem(k,v))`).catch(()=>{});
 ws.close();
}
