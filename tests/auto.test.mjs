import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import '../assets/pampuch-native.js';import '../assets/auto-native.js';import '../js/i8080.js';import '../js/pmd85.js';import '../js/auto.js';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
test('AUTO loads the original tape bytes at 2000h and starts with zero crashes and five laps',()=>{
 assert.equal(hash(AutoNativeData.program),AutoNativeData.programSha256);assert.equal(AutoNativeData.program.length,1253);
 const g=new AutoGame();assert.equal(g.state,'ready');assert.equal(g.crashes,0);assert.equal(g.lapsRemaining,5);assert.equal(g.machine.cpu.pc,0x2236);
 const before=g.machine.snapshot();g.advance(1000);assert.deepEqual(g.machine.snapshot(),before);assert.equal(g.takeEvents().length,0);
});
test('Both steering directions reach the native subpixel steering routines and release cleanly',()=>{
 const left=new AutoGame(),right=new AutoGame();left.start();right.start();left.turn('left');right.turn('right');
 left.advance(400);right.advance(400);assert.ok(left.machine.word(0x23a3)<right.machine.word(0x23a3));
 left.machine.portA=4;right.machine.portA=4;assert.equal(left.machine.input(0xf5)&32,0);assert.equal(right.machine.input(0xf5)&16,0);
 left.release();right.release();assert.equal(left.machine.input(0xf5)&32,32);assert.equal(right.machine.input(0xf5)&16,16);
});
test('The native road scrolls, counts collisions, bounces the car and writes original sound controls',()=>{
 const g=new AutoGame(),before=hash(g.machine.memory.subarray(0xc000));g.start();g.advance(25000);
 assert.notEqual(hash(g.machine.memory.subarray(0xc000)),before);assert.ok(g.crashes>0);assert.equal(g.state,'playing');assert.equal(g.lapsRemaining,5);
 assert.ok(g.takeEvents().some(e=>e.edges.some(([,control])=>control===4)));
});
test('Native steering, framebuffer and audio edges do not depend on browser frame partitioning',()=>{
 const a=new AutoGame(),b=new AutoGame();a.start();b.start();a.turn('right');b.turn('right');a.advance(500);for(let i=0;i<50;i++)b.advance(10);
 assert.deepEqual(a.machine.snapshot(),b.machine.snapshot());assert.deepEqual(a.takeEvents().flatMap(e=>e.edges),b.takeEvents().flatMap(e=>e.edges));
});
test('An Auto save restores CPU, all RAM and divider phase, paused with controls released',()=>{
 const g=new AutoGame();g.start();g.turn('left');g.advance(500);const saved=g.snapshot(),restored=AutoGame.restore(JSON.parse(JSON.stringify(saved)));
 assert.equal(restored.state,'paused');assert.deepEqual(restored.machine.snapshot(),g.machine.snapshot());assert.equal(restored.machine.steerLeft,false);
 const cycles=restored.machine.cpu.cycles;restored.advance(1000);assert.equal(restored.machine.cpu.cycles,cycles);g.release();restored.state='playing';g.advance(500);restored.advance(500);assert.deepEqual(restored.machine.snapshot(),g.machine.snapshot());
 for(const bad of [null,{...saved,version:2},{...saved,ticks:-1},{...saved,machine:{...saved.machine,ram:[]}}])assert.equal(AutoGame.restore(bad),null);
});
test('The unmodified five-lap drive reaches the native finish screen before showing results',()=>{
 const g=new AutoGame();g.start();let elapsed=0;const laps=new Set([5]);
 while(g.state==='playing'&&elapsed<1200000){g.advance(1000);g.takeEvents();elapsed+=1000;laps.add(g.lapsRemaining);}
 assert.equal(g.state,'over');assert.deepEqual([...laps],[5,4,3,2,1,0]);assert.equal(g.machine.cpu.pc,0x230f);assert.ok(g.crashes>0);
 assert.equal(AutoGame.restore(g.snapshot()).state,'over');const cycles=g.machine.cpu.cycles;g.advance(1000);assert.equal(g.machine.cpu.cycles,cycles);
});
