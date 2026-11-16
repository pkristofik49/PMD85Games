// Chrome DevTools verification using Node's built-in WebSocket, without packages.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const pages=await(await fetch('http://127.0.0.1:9333/json')).json();
const target=pages.find(p=>p.type==='page');
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map(),errors=[];
ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});
function call(method,params={}){return new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));});}
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(expression){for(let n=0;n<80;n++){if(await evaluate(expression))return;await delay(100);}throw Error('Timed out: '+expression);}
async function screenshot(name){const data=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/'+name,Buffer.from(data.data,'base64'));}
async function press(code,key){await call('Input.dispatchKeyEvent',{type:'keyDown',code,key});await call('Input.dispatchKeyEvent',{type:'keyUp',code,key});}
const base=process.argv[2]||'http://127.0.0.1:4173/PMD85Games/';
try{
 await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
 await call('Page.navigate',{url:'about:blank'});await delay(150);
 await call('Storage.clearDataForOrigin',{origin:new URL(base).origin,storageTypes:'all'});
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1080,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:base});
 await until(`document.querySelectorAll('.game-card').length===2 && !document.querySelector('#app').hasAttribute('v-cloak')`);
 await screenshot('menu-desktop.png');
 assert.equal(await evaluate(`document.querySelector('.game-card').dataset.game`),'flappy');
 // Generate application PNG icons from the tracked vector, rather than borrowing SMG branding.
 for(const [file,size]of [['icon-192.png',192],['icon-512.png',512],['maskable-512.png',512],['apple-touch-icon.png',180]]){
   const data=await evaluate(`(async()=>{const img=new Image();img.src='icons/icon.svg';await img.decode();const c=document.createElement('canvas');c.width=c.height=${size};const x=c.getContext('2d');x.fillStyle='#295244';x.fillRect(0,0,${size},${size});x.drawImage(img,${Math.round(size*.1)},${Math.round(size*.1)},${Math.round(size*.8)},${Math.round(size*.8)});return c.toDataURL('image/png').split(',')[1];})()`);
   fs.writeFileSync('icons/'+file,Buffer.from(data,'base64'));
 }
 await evaluate(`document.querySelector('[data-game="pampuch"]').click()`);
 await until(`document.querySelector('canvas[data-state="ready"]')`);
 await screenshot('pampuch-ready.png');
 await evaluate(`document.querySelector('.primary-button').click()`);
 await until(`document.querySelector('canvas[data-state="playing"]')`);
 await delay(380);await press('KeyP','p');
 await until(`document.querySelector('canvas[data-state="paused"]')`);
 const paused=await evaluate(`JSON.parse(localStorage.getItem('pmd85games.pampuch.v1'))`);
 assert.ok(paused.score>0);await delay(300);
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('pmd85games.pampuch.v1')).time`),paused.time);
 await screenshot('pampuch-paused.png');
 await evaluate(`document.querySelector('.primary-button').click()`);await delay(130);
 await press('KeyN','n');await until(`document.querySelector('.secondary-button')`);
 await press('Escape','Escape');assert.equal(await evaluate(`!!document.querySelector('.secondary-button')`),false);
 await press('KeyP','p');await call('Page.reload');
 await until(`document.querySelector('canvas[data-state="paused"]')`);
 assert.ok(await evaluate(`Number(document.querySelector('.scores strong').textContent)>0`));
 await evaluate(`document.querySelector('#language').value='en';document.querySelector('#language').dispatchEvent(new Event('change',{bubbles:true}))`);
 await until(`document.documentElement.lang==='en'`);
 assert.equal(await evaluate(`document.querySelector('.primary-button').textContent`),'Continue');
 await evaluate(`document.querySelector('#palette').value='dark';document.querySelector('#palette').dispatchEvent(new Event('change',{bubbles:true}))`);
 await until(`document.documentElement.dataset.palette==='dark'`);
 await evaluate(`document.querySelector('canvas[data-state]').focus()`);
 await press('KeyH','h');await press('KeyF','f');
 assert.equal(await evaluate(`document.querySelector('.application').classList.contains('expanded-mode')`),true);
 await screenshot('pampuch-expanded.png');await press('Escape','Escape');
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),true);
 assert.equal(await evaluate(`getComputedStyle(document.querySelector('.direction-pad')).display`),'grid');
 await screenshot('pampuch-mobile.png');
 await evaluate(`location.hash='#/'`);await until(`document.querySelectorAll('.game-card').length===2`);
 assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),true);await screenshot('menu-mobile.png');
 await evaluate(`document.querySelector('[data-game="flappy"]').click()`);
 await until(`document.querySelector('iframe')?.contentDocument.querySelector('.title-screen img')?.naturalWidth>0`);
 await screenshot('flappy-mobile.png');
 assert.equal(await evaluate(`document.querySelector('iframe').contentDocument.documentElement.scrollWidth<=document.querySelector('iframe').contentWindow.innerWidth`),true);
 await evaluate(`document.querySelector('iframe').contentDocument.querySelector('.title-screen').click()`);
 await until(`document.querySelector('iframe').contentDocument.querySelector('canvas')?.dataset.state==='entering'||document.querySelector('iframe').contentDocument.querySelector('canvas')?.dataset.state==='playing'`);
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1080,deviceScaleFactor:1,mobile:false});
 await screenshot('flappy-desktop.png');
 await evaluate(`location.hash='#/'`);await until(`!document.querySelector('iframe')`);
 // The root service worker must cache both games, including the embedded module graph.
 await until(`navigator.serviceWorker.getRegistration().then(r=>!!r?.active)`);
 await call('Page.reload');await until(`navigator.serviceWorker.controller!==null`);
 await call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 await call('Page.reload');await until(`document.querySelectorAll('.game-card').length===2`);
 await evaluate(`location.hash='#/flappy'`);await until(`document.querySelector('iframe')?.contentDocument.querySelector('.title-screen img')?.naturalWidth>0`);
 await evaluate(`location.hash='#/pampuch'`);await until(`document.querySelector('canvas[data-state="paused"]')`);
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('Browser checks passed: desktop, mobile, gameplay, pause, reload, translations, palettes, Flappy and both games offline.');
}finally{
 await call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});ws.close();
}
