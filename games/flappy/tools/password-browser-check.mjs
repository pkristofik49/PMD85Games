// End-to-end password access, persistence and offline checks. Native Chrome CDP only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const pages=await(await fetch('http://127.0.0.1:9222/json')).json();
const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
let id=0,saved;const pending=new Map(),errors=[];
ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)});
function call(method,params={}){return new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}))})}
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(80)}throw Error('Timed out: '+expression)}
async function password(code){
 await evaluate(`document.querySelector('#sector-password').focus();document.querySelector('#sector-password').value='';document.querySelector('#sector-password').dispatchEvent(new Event('input',{bubbles:true}))`);
 await call('Input.insertText',{text:code});
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});
 await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter'});
 await until(`!document.querySelector('#sector-password').value || document.querySelector('#sector-password').getAttribute('aria-invalid')==='true'`);
}
const options=()=>evaluate(`Array.from(document.querySelectorAll('[data-sector]:not(:disabled)'),b=>Number(b.dataset.sector))`);
async function open(){await evaluate(`document.querySelector('.sector-toggle').click()`);await until(`!!document.querySelector('#sector-password')`)}
async function snapshot(name){const clip=await evaluate(`(()=>{const r=document.querySelector('.viewport').getBoundingClientRect();return{x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1}})()`);const shot=await call('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/'+name,Buffer.from(shot.data,'base64'))}
try{
 await call('Runtime.enable');await call('Page.enable');await call('Network.enable');await call('Network.setBypassServiceWorker',{bypass:false});
 const url=process.argv[2]||'http://127.0.0.1:4173/Flappy/';
 await call('Storage.clearDataForOrigin',{origin:new URL(url).origin,storageTypes:'service_workers,cache_storage'});
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await call('Emulation.setTouchEmulationEnabled',{enabled:false});
 await call('Page.navigate',{url});await until(`!!document.querySelector('.sector-toggle') && !document.querySelector('#app').hasAttribute('v-cloak')`);
 saved=await evaluate(`JSON.stringify({...localStorage})`);
 await evaluate(`localStorage.setItem('flappy-pmd85-progress-v1',JSON.stringify({scene:1,unlocked:1}));localStorage.setItem('flappy.language','cs');localStorage.setItem('flappy.graphics','mono')`);
 await call('Page.reload');await delay(150);await until(`document.querySelector('canvas')?.dataset.state==='ready'`);
 assert.equal(await evaluate(`document.querySelector('#sector-password')===null && document.querySelector('.password-panel')===null`),true,'No password input remains outside the selector');
 await open();
 assert.deepEqual(await options(),[1]);assert.equal(await evaluate(`document.querySelector('.status')`),null);
 assert.equal(await evaluate(`getComputedStyle(document.querySelector('.intro>p')).fontFamily`),await evaluate(`getComputedStyle(document.querySelector('.about p')).fontFamily`));
 await password('xxxxx');assert.equal(await evaluate(`document.querySelector('#sector-password').getAttribute('aria-invalid')`),'true');assert.deepEqual(await options(),[1]);
 assert.equal(await evaluate(`getComputedStyle(document.querySelector('#sector-password')).borderTopColor`),'rgb(213, 156, 132)','Invalid passwords keep the red border');
 await password(':beda');assert.equal(await evaluate(`document.querySelector('canvas').dataset.state`),'ready');
 assert.deepEqual(await options(),[1,36,37,38,39,40]);assert.equal(await evaluate(`document.querySelector('.game-hud span:first-child b').textContent`),'001');
 assert.equal(await evaluate(`document.querySelector('#password-feedback')`),null,'Successful unlocking adds no feedback text');
 assert.equal(await evaluate(`document.querySelector('#sector-password').getAttribute('aria-invalid')`),'false');
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('flappy-pmd85-progress-v1')).scene`),1,'A password must not start a sector');
 assert.equal(await evaluate(`(()=>{const f=document.querySelector('.sector-footer').getBoundingClientRect(),p=document.querySelector('.password-form').getBoundingClientRect(),s=document.querySelector('.sector-progress').getBoundingClientRect();return Math.abs(f.right-p.right)<1&&s.right<p.left&&s.top<p.bottom&&s.bottom>p.top})()`),true,'Password is right aligned on the progress row');
 await snapshot('password-overlay-desktop.png');
 await evaluate(`document.querySelector('.sector-close').click()`);
 await evaluate(`document.querySelector('.language-menu-toggle').click()`);await until(`document.querySelector('.language-menu-toggle').getAttribute('aria-expanded')==='true'`);
 await evaluate(`document.querySelector('[data-language="en"]').click()`);await until(`document.documentElement.lang==='en'`);
 await open();await password('xxxxx');
 assert.equal(await evaluate(`document.querySelector('#password-feedback')`),null,'Invalid codes only set the input border');
 assert.equal(await evaluate(`document.querySelector('#sector-password').getAttribute('aria-invalid')`),'true');
 await evaluate(`document.querySelector('[data-sector="1"]').click()`);await until(`document.querySelector('canvas').dataset.state==='playing'`);
 await open();const frozen=await evaluate(`document.querySelector('canvas').toDataURL()`);
 await password('>abc<');assert.equal(await evaluate(`document.querySelector('canvas').dataset.state`),'paused');
 assert.deepEqual(await options(),[1,36,37,38,39,40,131,132,133,134,135]);
 assert.equal(await evaluate(`document.querySelector('.game-hud span:first-child b').textContent`),'001');
 await delay(220);assert.equal(await evaluate(`document.querySelector('canvas').toDataURL()`),frozen,'Password submission leaves the room frozen');
 await evaluate(`document.querySelector('#sector-password').focus()`);await call('Input.insertText',{text:'shiba'});
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Home',code:'Home',windowsVirtualKeyCode:36});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Home',code:'Home',windowsVirtualKeyCode:36});
 assert.equal(await evaluate(`document.activeElement.id==='sector-password' && document.activeElement.selectionStart===0`),true,'Input Home edits text instead of moving grid focus');
 await evaluate(`document.querySelector('[data-sector="131"]').click()`);await until(`document.querySelector('canvas').dataset.state==='playing'`);
 await evaluate(`navigator.serviceWorker.ready`);
 if(!await evaluate(`!!navigator.serviceWorker.controller`)){await call('Page.reload');await delay(150);await until(`!!document.querySelector('.sector-toggle')&&!document.querySelector('#app').hasAttribute('v-cloak')`)}
 await until(`!!navigator.serviceWorker.controller`);
 await call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await call('Page.reload');await delay(150);
 await until(`document.querySelector('canvas')?.dataset.state==='ready' && document.querySelector('.game-hud span:first-child b')?.textContent==='131'`);
 await open();
 assert.deepEqual(await options(),[1,36,37,38,39,40,131,132,133,134,135]);
 await password('ypalf');assert.equal(await evaluate(`document.querySelector('canvas').dataset.state`),'ready');
 assert.deepEqual(await options(),[1,36,37,38,39,40,131,132,133,134,135,196,197,198,199,200]);
 assert.equal(await evaluate(`document.querySelector('.game-hud span:first-child b').textContent`),'131');
 await evaluate(`document.querySelector('[data-sector="198"]').click()`);
 await until(`document.querySelector('canvas').dataset.state==='playing' && document.querySelector('.game-hud span:first-child b').textContent==='198'`);
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('flappy-pmd85-progress-v1')).scene`),198);
 await evaluate(`document.querySelector('.graphics-menu-toggle').click()`);await until(`!document.querySelector('[data-graphics="modern"]').disabled`);await evaluate(`document.querySelector('[data-graphics="modern"]').click()`);
 await call('Emulation.setDeviceMetricsOverride',{width:320,height:568,deviceScaleFactor:1,mobile:true});await call('Emulation.setTouchEmulationEnabled',{enabled:true});
 await open();await password('xxxxx');
 await evaluate(`document.querySelector('#sector-password').value='SHIBA';document.querySelector('#sector-password').dispatchEvent(new Event('input',{bubbles:true}))`);
 const point=await evaluate(`(()=>{const r=document.querySelector('.password-submit').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await until(`!document.querySelector('[data-sector="5"]').disabled`);
 assert.equal(await evaluate(`document.querySelector('[data-sector="5"]').disabled`),false);
 assert.equal(await evaluate(`document.querySelector('canvas').dataset.state`),'paused');
 assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),true);
 assert.equal(await evaluate(`(()=>{const f=document.querySelector('.password-form').getBoundingClientRect(),v=document.querySelector('.viewport').getBoundingClientRect();return f.left>=v.left&&f.right<=v.right&&f.bottom<=v.bottom})()`),true);
 await snapshot('password-overlay-mobile.png');
 assert.deepEqual(errors,[]);console.log('Passwords browser OK: overlay footer alignment, exact groups, no automatic room switch, frozen gameplay, keyboard editing, CS/EN, saved progress, offline access and mobile touch submission.');
}finally{
 await call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1}).catch(()=>{});
 if(saved)await evaluate(`localStorage.clear();Object.entries(JSON.parse(${JSON.stringify(saved)})).forEach(([k,v])=>localStorage.setItem(k,v))`).catch(()=>{});
 ws.close();
}
