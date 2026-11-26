// Usage: node tools/import-invaders.mjs path/to/games-1.ptp
import fs from 'node:fs';import crypto from 'node:crypto';import {deflateSync} from 'node:zlib';
await import('../assets/pampuch-native.js');await import('../js/i8080.js');await import('../js/pmd85.js');
const tape=fs.readFileSync(process.argv[2]),blocks=[];
for(let p=0;p<tape.length;){const size=tape.readUInt16LE(p);if(!size||p+2+size>tape.length)throw Error('Invalid PTP');blocks.push(tape.subarray(p+2,p+2+size));p+=size+2;}
const index=blocks.findIndex(b=>b.length===63&&b.subarray(54,62).toString()==='INVADERS');
if(index<0)throw Error('INVADERS tape header missing');
const header=blocks[index],program=blocks[index+1].subarray(0,-1),address=header.readUInt16LE(50);
if(address!==0x100||program.length!==header.readUInt16LE(52)+1||program.length!==1537)throw Error('Unexpected INVADERS layout');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const data={title:'INVADERS',author:'Ivan Fedorko / IFO Software',year:1985,address,source:'https://pmd85.borik.net/?action=download&did=10',tapeSha256:hash(tape),programSha256:hash(program)};
fs.writeFileSync('assets/invaders-native.js',`/* Original INVADERS tape program. See SOURCES.md. */\n(() => {\n  const data=${JSON.stringify(data)};\n  data.program=Uint8Array.from(atob('${program.toString('base64')}'),c=>c.charCodeAt(0));\n  globalThis.InvadersNativeData=data;\n})();\n`);
const machine=new Pmd85();machine.cpu.pc=0x8000;machine.until(0x84a1);machine.memory.set(program,address);machine.cpu.pc=address;machine.cpu.sp=0x7ff0;machine.until(0x05fd);
// Render the original title and difficulty menu.
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function chunk(type,data){const body=Buffer.concat([Buffer.from(type),data]),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(body));return Buffer.concat([size,body,crc]);}
const pixels=Buffer.alloc(256*865);
for(let y=0;y<256;y++)for(let x=0;x<288;x++){const on=machine.memory[0xc000+y*64+Math.floor(x/6)]&(1<<(x%6)),p=y*865+1+x*3;pixels[p]=pixels[p+1]=on?238:0;pixels[p+2]=on?222:0;}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(288);ihdr.writeUInt32BE(256,4);ihdr[8]=8;ihdr[9]=2;
fs.writeFileSync('assets/invaders-title.png',Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]));
console.log(JSON.stringify(data,null,2));
