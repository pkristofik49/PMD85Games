// Render the approved SVG through an isolated Chrome debugging session; no packages.
import fs from 'node:fs';
const pages=await(await fetch('http://127.0.0.1:9333/json')).json();
const page=pages.find(p=>p.type==='page');if(!page)throw Error('Start isolated Chrome with --remote-debugging-port=9333');
const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));});
const source='data:image/svg+xml;base64,'+fs.readFileSync('icons/icon.svg').toString('base64');
try{
 for(const [file,size,maskable]of [['icon-192.png',192,false],['icon-512.png',512,false],['maskable-512.png',512,true],['apple-touch-icon.png',180,false]]){
  const expression=`(async()=>{const img=new Image();img.src=${JSON.stringify(source)};await img.decode();const c=document.createElement('canvas');c.width=c.height=${size};const ctx=c.getContext('2d');${maskable||file==='apple-touch-icon.png'?`ctx.fillStyle='#203e32';ctx.fillRect(0,0,${size},${size});`:''}const inset=${maskable?Math.round(size*.1):0};ctx.drawImage(img,inset,inset,${size}-inset*2,${size}-inset*2);return c.toDataURL('image/png').split(',')[1];})()`;
  const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||'SVG rendering failed');
  const bytes=Buffer.from(result.result.value,'base64');
  if(bytes.readUInt32BE(16)!==size||bytes.readUInt32BE(20)!==size)throw Error('Invalid rendered dimensions');
  fs.writeFileSync('icons/'+file,bytes);console.log(`${file}: ${size} × ${size}`);
 }
}finally{ws.close();}
