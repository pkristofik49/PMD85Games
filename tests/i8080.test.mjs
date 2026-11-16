import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../js/i8080.js';
const diagnostics=[['8080PRE.COM',7817,/Preliminary tests complete/],['TST8080.COM',4924,/CPU IS OPERATIONAL/],['CPUTEST.COM',255653383,/CPU TESTS OK/]];
if(process.env.PMD_EXTENDED_CPU_TEST==='1')diagnostics.push(['8080EXM.COM',23803381171,/Tests complete/]);
for(const [name,expected,message]of diagnostics)test(`Independent ${name} diagnostics and exact cycle total`,()=>{
 const memory=new Uint8Array(65536);memory.set(fs.readFileSync(new URL('fixtures/i8080/'+name,import.meta.url)),256);
 memory.set([0xd3,0],0);memory.set([0xd3,1,0xc9],5);let done=false,output='',instructions=0;
 const cpu=new Intel8080(memory,{output:port=>{
  if(port===0)done=true;
  else if(port===1){if(cpu.r[1]===2)output+=String.fromCharCode(cpu.r[3]);else if(cpu.r[1]===9){let a=cpu.pair(1);while(memory[a]!==36)output+=String.fromCharCode(memory[a++]);}}
 }});cpu.pc=256;
 while(!done&&instructions++<3000000000)cpu.step();
 assert.ok(done,'Diagnostic finished');assert.match(output,message);assert.doesNotMatch(output,/ERROR|FAIL/i);assert.equal(cpu.cycles,expected);
});
test('PMD video arbitration includes the clock phase on consecutive instructions',()=>{
 const cpu=new Intel8080(new Uint8Array(65536),{pmdTiming:true});cpu.m.set([0x01,0,0,0]);
 assert.equal(cpu.step(),11);assert.equal(cpu.step(),5);assert.equal(cpu.cycles,16);
});
