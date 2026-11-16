import fs from 'node:fs';
import zlib from 'node:zlib';
import {sprites} from '../assets/game-data.js';
const crc=bytes=>{let c=0xffffffff;for(const byte of bytes){c^=byte;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0};
function chunk(name,data){const tag=Buffer.from(name),size=Buffer.alloc(4),sum=Buffer.alloc(4);size.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([tag,data])));return Buffer.concat([size,tag,data,sum])}
for(const [size,name]of [[192,'icon-192'],[512,'icon-512'],[512,'icon-maskable-512']]){
 const scale=Math.floor(size/25),ox=Math.floor((size-12*scale)/2),oy=Math.floor((size-16*scale)/2);
 const raw=Buffer.alloc((1+size*4)*size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const sx=Math.floor((x-ox)/scale),sy=Math.floor((y-oy)/scale);
  const lit=sx>=0&&sx<12&&sy>=0&&sy<16&&(sprites.front[sy*2+Math.floor(sx/6)]&(1<<(sx%6)));
  const i=y*(size*4+1)+1+x*4;raw.set(lit?[217,237,146,255]:[23,26,23,255],i);
 }
 const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
 fs.writeFileSync(new URL(`../assets/${name}.png`,import.meta.url),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
}
console.log('PWA icons generated from the PMD bitmap');
