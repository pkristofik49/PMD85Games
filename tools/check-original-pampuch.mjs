// Compile an independent C core, then compare native RAM, registers and sound.
// Usage: node tools/check-original-pampuch.mjs <8080 checkout> <GPMD checkout> <tape> <cc> [--write-fixture]
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import '../assets/pampuch-native.js';import '../js/i8080.js';import '../js/pmd85.js';
const [reference,gpmd,tape,compiler]=process.argv.slice(2);if(!compiler)throw Error('Supply reference checkouts, tape and compiler');
const temp=path.resolve('.tools/pampuch-reference');fs.mkdirSync(temp,{recursive:true});
const bytes=fs.readFileSync(tape),blocks=[];
for(let p=0;p<bytes.length;){const size=bytes.readUInt16LE(p);blocks.push(bytes.subarray(p+2,p+2+size));p+=size+2;}
const block=blocks[blocks.findIndex(b=>b.length===63&&b.subarray(54,62).toString()==='PAMPUCH ')+2];
assert.equal(createHash('sha256').update(block).digest('hex'),'28371bc736e54701e3301cda6ff021959d0bc58a29ace968bb61c47faa098c6f');
assert.deepEqual([...block.subarray(0,-1)],PampuchNativeData.program);
assert.equal(createHash('sha256').update(fs.readFileSync(path.join(gpmd,'rom/monit1.rom'))).digest('hex'),'1fed5851c353d24f99eae88bfdb858ca0e01c9d737be94eb7e761efeeb84a849');
const header=fs.readFileSync(path.join(gpmd,'src/ChipCpu8080P.h'),'utf8');
const constants=Object.fromEntries([...header.matchAll(/#define\s+(WTR\w+)\s+(\d+)/g)].map(m=>[m[1],Number(m[2])]));
const cpp=fs.readFileSync(path.join(gpmd,'src/ChipCpu8080P.cpp'),'utf8');
const table=cpp.match(/duration\[256\] = \{([\s\S]*?)\};/)[1].replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g,'');
const durations=table.match(/WTR\w+/g).map(k=>constants[k]);assert.equal(durations.length,256);
fs.copyFileSync(path.join(gpmd,'rom/monit1.rom'),path.join(temp,'monitor.bin'));
fs.writeFileSync(path.join(temp,'program.bin'),Buffer.from(PampuchNativeData.program));
const source=String.raw`
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "i8080.h"
static unsigned char mem[65536],columns[16],portA=0,portC=0,control=0x8a;
static uint32_t soundHash=2166136261u;static unsigned long soundCount=0,currentCycle=0;
static i8080 cpu;
static int duration[256]={TABLE};
static unsigned char rd(void* p,unsigned short a){if(a>=0xa000&&a<0xb000)return mem[a-0x2000];if((a>=0x9000&&a<0xa000)||(a>=0xb000&&a<0xc000))return 255;return mem[a];}
static void wr(void* p,unsigned short a,unsigned char v){if(a<0x8000||a>=0xc000)mem[a]=v;}
static void hashByte(uint32_t* h,unsigned char b){*h=(*h^b)*16777619u;}
static void sound(unsigned char value){if((value&7)!=(portC&7)){unsigned long cycle=currentCycle;for(int j=0;j<4;j++)hashByte(&soundHash,(cycle>>(j*8))&255);hashByte(&soundHash,value&7);soundCount++;}portC=value;}
static unsigned char in(void* p,unsigned char port){switch(port&0x8f){case 0x84:return portA;case 0x85:return (~columns[portA&15]&31)|0x60;case 0x86:return portC;case 0x87:return control;default:return 255;}}
static void out(void* p,unsigned char port,unsigned char v){switch(port&0x8f){case 0x84:portA=v;break;case 0x86:sound(v);break;case 0x87:if(v&128){control=v;portA=0;sound(0);}else{int bit=1<<((v>>1)&7);sound((v&1)?portC|bit:portC&~bit);}break;}}
static int condition(int n){switch(n){case 0:return !cpu.zf;case 1:return cpu.zf;case 2:return !cpu.cf;case 3:return cpu.cf;case 4:return !cpu.pf;case 5:return cpu.pf;case 6:return !cpu.sf;default:return cpu.sf;}}
static void step(void){unsigned char o=rd(0,cpu.pc);unsigned long before=cpu.cyc;currentCycle=before;int taken=(((o&0xc7)==0xc0)||((o&0xc7)==0xc4))&&condition((o>>3)&7);i8080_step(&cpu);cpu.cyc=before+(taken?((o&0xc7)==0xc0?13:20):duration[o])+(before&1);}
static int word(int a){return mem[a]|mem[a+1]<<8;}
static void snapshot(int frame){uint32_t h=2166136261u;for(int i=0;i<65536;i++)hashByte(&h,mem[i]);unsigned char f=2|(cpu.sf?128:0)|(cpu.zf?64:0)|(cpu.hf?16:0)|(cpu.pf?4:0)|(cpu.cf?1:0);printf("[%d,%lu,%u,%u,%u,%u,%u,%u,%u,%u,%u,%u,%u,%u,%lu,%d,%d,%d,%d,%d,%d,%d]",frame,cpu.cyc,cpu.pc,cpu.sp,cpu.b,cpu.c,cpu.d,cpu.e,cpu.h,cpu.l,cpu.a,f,h,soundHash,soundCount,word(0xc6a),word(0xc6e),word(0xc70),word(0xc72),word(0xc74),word(0xc6c),mem[0xc7c]);}
int main(int argc,char**argv){FILE* file;memset(mem,0,sizeof(mem));file=fopen(argv[1],"rb");fread(mem+0x8000,1,4096,file);fclose(file);i8080_init(&cpu);cpu.read_byte=rd;cpu.write_byte=wr;cpu.port_in=in;cpu.port_out=out;cpu.pc=0x8000;int limit=4000000;while(cpu.pc!=0x84a1&&--limit)step();if(!limit)return 2;file=fopen(argv[2],"rb");fread(mem+0x100,1,3984,file);fclose(file);int scenario=atoi(argv[3]);mem[0x122]=mem[0x109]=scenario==1?4:scenario==2?8:1;cpu.sp=0x7d7c;cpu.pc=0x103;limit=4000000;while(cpu.pc!=0x191&&--limit)step();if(!limit)return 3;if(scenario==1||scenario==2){mem[0xc6c]=1;mem[0xc6d]=0;}if(scenario==3){mem[0xb49]=0;mem[0xb4a]=0;}soundHash=2166136261u;soundCount=0;printf("[");snapshot(-1);unsigned long target=cpu.cyc;for(int frame=0;frame<(scenario==0?1800:200);frame++){memset(columns,0,16);if(scenario==0&&frame%100>=30&&frame%100<40)columns[1]|=4;if(scenario==0&&frame%100>=50&&frame%100<65)columns[12]|=4;if(scenario==0&&frame%100>=80&&frame%100<90)columns[1]|=16;target+=204800;while(cpu.cyc<target&&cpu.pc!=0x8bd)step();printf(",");snapshot(frame);}printf("]");return 0;}
`.replace('TABLE',durations.join(','));
const sourceFile=path.join(temp,'reference.c');fs.writeFileSync(sourceFile,source);
const executable=path.join(temp,process.platform==='win32'?'reference.exe':'reference');
execFileSync(compiler,['-std=c99','-I'+path.resolve(reference),sourceFile,path.join(path.resolve(reference),'i8080.c'),'-o',executable]);

const cases=[];
for(let scenario=0;scenario<4;scenario++){
 const native=JSON.parse(execFileSync(executable,[path.join(temp,'monitor.bin'),path.join(temp,'program.bin'),String(scenario)],{maxBuffer:8e6}).toString());
 let soundHash=2166136261,soundCount=0;
 const hash=(h,b)=>Math.imul(h^b,16777619)>>>0;
 function snapshot(machine,frame){for(const [cycle,control]of machine.edges){for(let j=0;j<4;j++)soundHash=hash(soundHash,(cycle>>>(j*8))&255);soundHash=hash(soundHash,control);soundCount++;}machine.edges=[];let h=2166136261;for(const b of machine.memory)h=hash(h,b);const c=machine.cpu;return[frame,c.cycles,c.pc,c.sp,...c.r.slice(0,6),c.r[7],c.f,h,soundHash,soundCount,...[0xc6a,0xc6e,0xc70,0xc72,0xc74,0xc6c].map(a=>machine.word(a)),machine.memory[0xc7c]];}
 const machine=new Pmd85();machine.boot(scenario===1?4:scenario===2?8:1);
 if(scenario===1||scenario===2){machine.memory[0xc6c]=1;machine.memory[0xc6d]=0;}
 if(scenario===3){machine.memory[0xb49]=0;machine.memory[0xb4a]=0;}
 assert.deepEqual(snapshot(machine,-1),native[0],'Native boot '+scenario);
 for(let frame=0;frame<(scenario===0?1800:200);frame++){
  machine.release();if(scenario===0){if(frame%100>=30&&frame%100<40)machine.key('up',true);if(frame%100>=50&&frame%100<65)machine.key('left',true);if(frame%100>=80&&frame%100<90)machine.key('down',true);}
  machine.advance(204800,{stopAt:0x8bd});assert.deepEqual(snapshot(machine,frame),native[frame+1],`Native scenario ${scenario}, frame ${frame}`);
 }
 cases.push({scenario,frames:native});
}
const fixture={source:'superzazu/8080 independent C core + GPMD85Emulator PMD wait states',cases};
if(process.argv.includes('--write-fixture'))fs.writeFileSync('tests/fixtures/pampuch-native-trace.json',JSON.stringify(fixture)+'\n');
console.log('Native C/JS comparison passed: 2,400 checkpoints, including ghost pursuit, deaths, tombs, map transitions, bonus lives and timeout; RAM, registers, cycles and sound transitions match.');
