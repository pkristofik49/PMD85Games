// Isolated browser fixtures exercise real automatic wins without a test API in the app.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {levels} from '../assets/game-data.js';
const pages=await(await fetch('http://127.0.0.1:9222/json')).json();
const ws=new WebSocket(pages.find(page=>page.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
let id=0,saved;const pending=new Map(),errors=[];
const fixtureLevels=structuredClone(levels);
const winningRoom={walls:[],objects:[{type:2,x:5,y:18},{type:6,x:5,y:21}]};
fixtureLevels[0]=winningRoom;fixtureLevels[199]=winningRoom;
fixtureLevels[1]={walls:[[9,5]],objects:[{type:2,x:15,y:15},{type:6,x:25,y:21}]};
const source=fs.readFileSync(new URL('../assets/game-data.js',import.meta.url),'utf8')
  .replace(/export const levels = [^\n]+;/,`export const levels = ${JSON.stringify(fixtureLevels)};`);
function call(method,params={}){return new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}))})}
ws.addEventListener('message',event=>{
 const m=JSON.parse(event.data);
 if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}
 if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
 if(m.method==='Fetch.requestPaused')void call('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/javascript; charset=utf-8'},{name:'Cache-Control',value:'no-store'}],body:Buffer.from(source).toString('base64')}).catch(error=>errors.push(error.message));
});
async function evaluate(expression){const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description);return result.result.value}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(expression){for(let i=0;i<160;i++){if(await evaluate(expression))return;await delay(50)}throw Error('Timed out: '+expression)}
async function screenshot(name){const result=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/'+name,Buffer.from(result.data,'base64'))}
async function space(){await call('Input.dispatchKeyEvent',{type:'keyDown',code:'Space',key:' '});await call('Input.dispatchKeyEvent',{type:'keyUp',code:'Space',key:' '})}
try{
 await call('Runtime.enable');await call('Page.enable');await call('Network.enable');
 await call('Emulation.setDeviceMetricsOverride',{width:1200,height:1100,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:process.argv[2]||'http://127.0.0.1:4173/Flappy/'});
 await until(`document.querySelector('#app') && !document.querySelector('#app').hasAttribute('v-cloak')`);
 saved=await evaluate(`Object.fromEntries(['flappy-pmd85-progress-v1','flappy.language','flappy.sound','flappy.graphics'].map(key=>[key,localStorage.getItem(key)]))`);
 await evaluate(`localStorage.setItem('flappy-pmd85-progress-v1',JSON.stringify({scene:1,unlocked:1}));localStorage.setItem('flappy.language','cs');localStorage.setItem('flappy.sound','false');localStorage.setItem('flappy.graphics','mono')`);
 await call('Network.setBypassServiceWorker',{bypass:true});await call('Network.setCacheDisabled',{cacheDisabled:true});
 await call('Fetch.enable',{patterns:[{urlPattern:'*assets/game-data.js*',requestStage:'Request'}]});
 await call('Page.reload',{ignoreCache:true});
 await until(`document.querySelector('canvas')?.dataset.state==='ready' && !document.querySelector('#app').hasAttribute('v-cloak')`);
 await space();
 await until(`document.querySelector('canvas').dataset.transition==='blink'`);
 assert.equal(await evaluate(`document.querySelector('.overlay')===null`),true);
 const visibility=new Set();
 for(let i=0;i<8;i++){
  visibility.add(await evaluate(`(()=>{const data=document.querySelector('canvas').getContext('2d').getImageData(6,32,12,16).data;return Array.from(data).some((value,index)=>index%4!==3&&value>0)})()`));
  await delay(70);
 }
 assert.equal(visibility.size,2,'Flappy must visibly blink');
 await until(`document.querySelector('canvas').dataset.transition==='cover'`);
 await evaluate(`document.querySelector('.pause-button').click()`);
 await until(`document.querySelector('canvas').dataset.state==='paused'`);
 const frozen=await evaluate(`document.querySelector('canvas').toDataURL()`);
 await delay(300);assert.equal(await evaluate(`document.querySelector('canvas').toDataURL()`),frozen);
 await screenshot('transition-cover.png');
 await evaluate(`document.querySelector('.primary').click()`);
 await until(`document.querySelector('canvas').dataset.transition==='hold'`);
 assert.equal(await evaluate(`document.querySelector('.game-hud span:first-child b').textContent`),'002');
 await screenshot('transition-full.png');
 await until(`document.querySelector('canvas').dataset.transition==='reveal'`);
 await delay(200);await screenshot('transition-reveal.png');
 await until(`document.querySelector('canvas').dataset.state==='entering'`);
 assert.equal(await evaluate(`document.querySelector('.game-hud span:last-child b').textContent`),'6:00');
 await until(`document.querySelector('canvas').dataset.state==='playing'`);
 assert.equal(await evaluate(`Number(document.querySelector('.lives').textContent)`),5);
 assert.equal(await evaluate(`document.querySelector('.game-hud span:first-child b').textContent`),'002');
 assert.deepEqual(await evaluate(`JSON.parse(localStorage.getItem('flappy-pmd85-progress-v1'))`),{scene:2,unlocked:2,bonus:[]});
 // Completion of the final scene must stop on the victory screen.
 await evaluate(`localStorage.setItem('flappy-pmd85-progress-v1',JSON.stringify({scene:200,unlocked:200}))`);
 await call('Page.reload',{ignoreCache:true});
 await until(`document.querySelector('canvas')?.dataset.state==='ready' && !document.querySelector('#app').hasAttribute('v-cloak')`);
 await evaluate(`window.__phases=[];new MutationObserver(()=>window.__phases.push(document.querySelector('canvas').dataset.transition)).observe(document.querySelector('canvas'),{attributes:true,attributeFilter:['data-transition']})`);
 await space();await until(`document.querySelector('canvas').dataset.state==='won'`);
 assert.equal(await evaluate(`document.querySelector('.game-hud span:first-child b').textContent`),'200');
 assert.equal(await evaluate(`window.__phases.includes('cover')||window.__phases.includes('reveal')`),false);
 assert.match(await evaluate(`document.querySelector('.overlay p').textContent`),/Dokončil/);
 assert.deepEqual(errors,[]);console.log('Transition browser OK: real win, visible blinking, brick fill/hold/reveal, pause, automatic scene 2 with lives preserved and final scene 200.');
}finally{
 await call('Fetch.disable').catch(()=>{});
 await call('Network.setBypassServiceWorker',{bypass:false}).catch(()=>{});
 await call('Network.setCacheDisabled',{cacheDisabled:false}).catch(()=>{});
 if(saved)await evaluate(`(()=>{const saved=${JSON.stringify(saved)};for(const [key,value]of Object.entries(saved)){if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}})()`).catch(()=>{});
 ws.close();
}
