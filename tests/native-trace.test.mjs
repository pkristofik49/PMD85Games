import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../assets/pampuch-native.js';import '../js/i8080.js';import '../js/pmd85.js';
const fixture=JSON.parse(fs.readFileSync(new URL('fixtures/pampuch-native-trace.json',import.meta.url)));
const names=['180 seconds of native pursuit, wall collisions, deaths and tombstones','Map four completion and bonus life','Map eight completion and bonus life','Native timer expiration'];
for(const {scenario,frames}of fixture.cases)test(`Independent C reference: ${names[scenario]}`,()=>{
 const machine=new Pmd85();machine.boot(scenario===1?4:scenario===2?8:1);
 if(scenario===1||scenario===2){machine.memory[0xc6c]=1;machine.memory[0xc6d]=0;}
 if(scenario===3){machine.memory[0xb49]=0;machine.memory[0xb4a]=0;}
 let soundHash=2166136261,soundCount=0;
 const hash=(h,b)=>Math.imul(h^b,16777619)>>>0;
 function check(frame,expected){
  for(const [cycle,control]of machine.edges){for(let j=0;j<4;j++)soundHash=hash(soundHash,(cycle>>>(j*8))&255);soundHash=hash(soundHash,control);soundCount++;}machine.edges=[];
  let h=2166136261;for(const b of machine.memory)h=hash(h,b);
  const c=machine.cpu,actual=[frame,c.cycles,c.pc,c.sp,...c.r.slice(0,6),c.r[7],c.f,h,soundHash,soundCount,...[0xc6a,0xc6e,0xc70,0xc72,0xc74,0xc6c].map(a=>machine.word(a)),machine.memory[0xc7c]];
  assert.deepEqual(actual,expected,`Native checkpoint ${frame}`);
 }
 check(-1,frames[0]);
 for(let frame=0;frame<frames.length-1;frame++){
  machine.release();if(scenario===0){if(frame%100>=30&&frame%100<40)machine.key('up',true);if(frame%100>=50&&frame%100<65)machine.key('left',true);if(frame%100>=80&&frame%100<90)machine.key('down',true);}
  machine.advance(204800,{stopAt:0x8bd});check(frame,frames[frame+1]);
 }
 if(scenario===1||scenario===2){assert.equal(machine.memory[0xb48],scenario===1?5:9);assert.ok(machine.memory[0xc7c]>=5);}
 if(scenario===3)assert.equal(machine.cpu.pc,0x8bd);
});
