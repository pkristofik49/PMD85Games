// Usage: node tools/import-zaby.mjs path/to/games-other.mrm
import fs from 'node:fs';import crypto from 'node:crypto';import {deflateSync} from 'node:zlib';
await import('../assets/pampuch-native.js');await import('../js/i8080.js');await import('../js/pmd85.js');
const image=fs.readFileSync(process.argv[2]),directory=image[12]*128,end=directory+image[13]*128;
if(end>image.length)throw Error('Invalid MRM directory');
let entry;
for(let a=directory;a<end;a+=32)if(image[a]===63&&image.subarray(a+1,a+9).toString()==='ZABY    ')entry=image.subarray(a,a+32);
if(!entry)throw Error('ZABY MRM entry missing');
const offset=entry.readUInt16LE(9)*128,address=entry.readUInt16LE(11),size=entry.readUInt16LE(13),program=image.subarray(offset,offset+size);
if(address!==0x7500||size!==1836||program.length!==size||(entry[15]&2))throw Error('Unexpected ZABY layout');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const data={title:'ZABY',address,source:'https://pmd85.borik.net/?action=download&did=10',mrmSha256:hash(image),programSha256:hash(program)};
fs.writeFileSync('assets/zaby-native.js',`/* Original ZABY MRM program. See SOURCES.md and tools/import-zaby.mjs. */\n(() => {\n  const data=${JSON.stringify(data)};\n  data.program=Uint8Array.from(atob('${program.toString('base64')}'),c=>c.charCodeAt(0));\n  globalThis.ZabyNativeData=data;\n})();\n`);
const machine=new Pmd85();machine.cpu.pc=0x8000;machine.until(0x84a1);machine.memory.set(program,address);machine.cpu.pc=address;machine.cpu.sp=0x8000;machine.cpu.r[7]=1;machine.until(0x7524);
// Capture the original title, after its original depacker and text renderer.
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function chunk(type,data){const body=Buffer.concat([Buffer.from(type),data]),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(body));return Buffer.concat([size,body,crc]);}
const pixels=Buffer.alloc(256*865);
for(let y=0;y<256;y++)for(let x=0;x<288;x++){const on=machine.memory[0xc000+y*64+Math.floor(x/6)]&(1<<(x%6)),p=y*865+1+x*3;pixels[p]=pixels[p+1]=on?238:0;pixels[p+2]=on?222:0;}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(288);ihdr.writeUInt32BE(256,4);ihdr[8]=8;ihdr[9]=2;
fs.writeFileSync('assets/zaby-title.png',Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]));
console.log(JSON.stringify(data,null,2));
