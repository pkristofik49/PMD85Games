import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import '../assets/pampuch-native.js';import '../assets/boulder-native.js';import '../js/i8080.js';import '../js/pmd85.js';import '../js/boulder.js';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
test('BOULD+4 is imported unmodified and starts in its native maze with ten lives',()=>{
 assert.equal(hash(BoulderNativeData.program),BoulderNativeData.programSha256);
 const g=new Boulder();assert.equal(g.state,'ready');assert.equal(g.lives,10);assert.equal(g.machine.cpu.pc,0x3320);assert.equal(g.machine.word(0x3055),0x350a);
 const cycles=g.machine.cpu.cycles;g.advance(1000);assert.equal(g.machine.cpu.cycles,cycles);assert.equal(g.takeEvents().length,0);
});
test('Native maze movement and PIO sound respond to held and released browser directions',()=>{
 const g=new Boulder(),before=hash(g.machine.memory.subarray(0xc000));g.start();g.turn('left');g.advance(400);
 assert.notEqual(hash(g.machine.memory.subarray(0xc000)),before);assert.ok(g.takeEvents().some(e=>e.edges.length>0));
 assert.equal(g.machine.columns[12],4);g.release();assert.equal(g.machine.columns[12],0);
});
test('Space action drives the original active-low SHIFT line independently of E/Y movement',()=>{
 const g=new Boulder();g.start();g.machine.portA=2;g.turn('up');assert.equal(g.machine.input(0xf5)&4,0);assert.equal(g.machine.input(0xf5)&64,64);
 g.turn('action');assert.equal(g.machine.input(0xf5)&64,0);g.turn('action',false);assert.equal(g.machine.input(0xf5)&64,64);
 g.release();assert.equal(g.machine.input(0xf5)&4,4);
});
test('The original sector loader and cave loop execute without a browser rules engine',()=>{
 const g=new Boulder();g.start();
 // Enter the original sector loader with its native sector-1 argument. This
 // fixture skips maze navigation, without patching any program instruction.
 g.machine.cpu.r[7]=1;g.machine.cpu.pc=0x1381;g.machine.until(0x143c);g.machine.targetCycles=g.machine.cpu.cycles;
 assert.equal(g.machine.word(0x0eb7),0x2000);
 const before=hash(g.machine.memory.subarray(0xc000));g.advance(2500);
 assert.notEqual(hash(g.machine.memory.subarray(0xc000)),before);assert.ok(g.machine.cpu.cycles>g.startedAt);
});
test('Boulder execution and native audio edges are independent of animation frame partitioning',()=>{
 const a=new Boulder(),b=new Boulder();a.start();b.start();a.turn('left');b.turn('left');
 a.advance(500);for(let i=0;i<50;i++)b.advance(10);
 assert.deepEqual(a.machine.snapshot(),b.machine.snapshot());
 assert.deepEqual(a.takeEvents().flatMap(e=>e.edges),b.takeEvents().flatMap(e=>e.edges));
});
test('Boulder saves retain RAM, CPU and divider phase and restore paused with released controls',()=>{
 const g=new Boulder();g.start();g.turn('left');g.turn('action');g.advance(500);const saved=g.snapshot();
 const restored=Boulder.restore(JSON.parse(JSON.stringify(saved)));assert.equal(restored.state,'paused');assert.deepEqual(restored.machine.snapshot(),g.machine.snapshot());
 assert.equal(restored.machine.action,false);assert.ok(restored.machine.columns.every(n=>n===0));const cycles=restored.machine.cpu.cycles;restored.advance(300);assert.equal(restored.machine.cpu.cycles,cycles);
 g.release();restored.state='playing';g.advance(200);restored.advance(200);assert.deepEqual(restored.machine.snapshot(),g.machine.snapshot());
 for(const bad of [null,{...saved,version:2},{...saved,machine:{...saved.machine,ram:[]}}, {...saved,ticks:-1}])assert.equal(Boulder.restore(bad),null);
});
test('Game over stops at the original exhausted-lives branch',()=>{
 const g=new Boulder();g.start();g.machine.cpu.pc=0x3235;g.machine.targetCycles=g.machine.cpu.cycles;g.advance(20);assert.equal(g.state,'over');assert.equal(g.lives,0);assert.equal(Boulder.restore(g.snapshot()).state,'over');
});
