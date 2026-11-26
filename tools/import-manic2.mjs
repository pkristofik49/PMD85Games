// Usage: node tools/import-manic2.mjs path/to/games-vbg.ptp
import fs from 'node:fs';import crypto from 'node:crypto';import {deflateSync} from 'node:zlib';
await import('../assets/pampuch-native.js');await import('../js/i8080.js');await import('../js/pmd85.js');
const source=fs.readFileSync(process.argv[2]),blocks=[];
for(let p=0;p<source.length;){const size=source.readUInt16LE(p);if(!size||p+2+size>source.length)throw Error('Invalid PTP');blocks.push(source.subarray(p+2,p+2+size));p+=size+2;}
const index=blocks.findIndex(b=>b.length===63&&b.subarray(54,62).toString()==='MANIC2+3');
if(index<0||blocks[index].readUInt16LE(50)!==0x7c00)throw Error('MANIC2+3 tape header missing');
const machine=new Pmd85();machine.cpu.pc=0x8000;machine.until(0x84a1);machine.memory.set(blocks[index+1].subarray(0,-1),0x7c00);
const tape=Buffer.concat([blocks[index+2],blocks[index+3]]);let position=0;const input=machine.input.bind(machine);
machine.input=port=>(port&255)===0x1e?(tape[position++]??255):(port&255)===0x1f?3:input(port);machine.cpu.pc=0x7c00;
let steps=0;while(!(position===tape.length&&machine.cpu.pc===0x84a1)){if(++steps>16000000)throw Error('Native MANIC2+3 loader did not finish');machine.cpu.step();}
machine.input=input;const program=Buffer.from(machine.memory.subarray(0,0x8000));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const data={title:'MANIC2+3',year:1987,author:'VBG Software',source:'https://pmd85.borik.net/?action=download&did=8',tapeSha256:hash(source),programSha256:hash(program)};
fs.writeFileSync('assets/manic2-native.js',`/* Original MANIC2+3 program. See SOURCES.md and tools/import-manic2.mjs. */\n(() => {\n  const data=${JSON.stringify(data)};\n  data.program=Uint8Array.from(atob('${program.toString('base64')}'),c=>c.charCodeAt(0));\n  globalThis.Manic2NativeData=data;\n})();\n`);
machine.cpu.pc=0x0230;machine.cpu.sp=0x7ffb;machine.until(0x0238);
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function chunk(type,data){const body=Buffer.concat([Buffer.from(type),data]),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(body));return Buffer.concat([size,body,crc]);}
const pixels=Buffer.alloc(256*865);
for(let y=0;y<256;y++)for(let x=0;x<288;x++){const on=machine.memory[0xc000+y*64+Math.floor(x/6)]&(1<<(x%6)),p=y*865+1+x*3;pixels[p]=pixels[p+1]=on?238:0;pixels[p+2]=on?222:0;}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(288);ihdr.writeUInt32BE(256,4);ihdr[8]=8;ihdr[9]=2;
fs.writeFileSync('assets/manic2-title.png',Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]));
console.log(JSON.stringify(data,null,2));
