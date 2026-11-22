import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import '../assets/pampuch-native.js';import '../assets/zaby-native.js';import '../js/i8080.js';import '../js/pmd85.js';import '../js/zaby.js';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
test('ZABY executes the archived MRM depacker and native start menu before its eight-frog game',()=>{
 assert.equal(hash(ZabyNativeData.program),ZabyNativeData.programSha256);assert.equal(ZabyNativeData.program.length,1836);
 const g=new ZabyGame();assert.equal(g.state,'ready');assert.equal(g.machine.cpu.pc,0x7da0);assert.equal(g.lives,8);assert.equal(g.score,0);
 const before=g.machine.snapshot();g.advance(1000);assert.deepEqual(g.machine.snapshot(),before);assert.equal(g.takeEvents().length,0);
});
test('New frog and jump drive the original K9 and K4 matrix inputs with native deployment scoring',()=>{
 const g=new ZabyGame();g.start();g.turn('newFrog');g.machine.portA=9;assert.equal(g.machine.input(0xf5)&1,0);
 g.advance(100);g.release();assert.equal(g.machine.columns[9],0);assert.equal(g.machine.memory[0x77a0],0xfb);assert.equal(g.score,9950,'Original BCD score wraps after deployment cost');
 g.turn('up');g.machine.portA=4;assert.equal(g.machine.input(0xf5)&1,0);g.advance(400);g.release();
 assert.ok(g.machine.memory[0x77a0]<0xfb,'The native jump climbs to another platform');assert.ok(g.takeEvents().some(e=>e.edges.length>0));assert.equal(g.machine.columns[4],0);
});
test('Platforms scroll natively while an idle frog stock remains available without browser-imposed movement',()=>{
 const g=new ZabyGame(),before=hash(g.machine.memory.subarray(0xc000));g.start();g.advance(500);
 assert.notEqual(hash(g.machine.memory.subarray(0xc000)),before);assert.equal(g.lives,8);assert.equal(g.machine.memory[0x77a0],0);assert.equal(g.score,0);
});
test('Native CPU, framebuffer and audio edges are independent of browser frame partitioning',()=>{
 const a=new ZabyGame(),b=new ZabyGame();a.start();b.start();a.turn('newFrog');b.turn('newFrog');a.turn('up');b.turn('up');
 a.advance(500);for(let i=0;i<50;i++)b.advance(10);
 assert.deepEqual(a.machine.snapshot(),b.machine.snapshot());assert.deepEqual(a.takeEvents().flatMap(e=>e.edges),b.takeEvents().flatMap(e=>e.edges));
});
test('Zaby snapshots restore all RAM, CPU and sound phase, paused with both controls released',()=>{
 const g=new ZabyGame();g.start();g.turn('newFrog');g.advance(100);g.release();g.turn('action');g.advance(300);
 const saved=g.snapshot(),restored=ZabyGame.restore(JSON.parse(JSON.stringify(saved)));assert.equal(restored.state,'paused');assert.deepEqual(restored.machine.snapshot(),g.machine.snapshot());assert.ok(restored.machine.columns.every(n=>n===0));
 const cycles=restored.machine.cpu.cycles;restored.advance(1000);assert.equal(restored.machine.cpu.cycles,cycles);
 g.release();restored.state='playing';g.advance(200);restored.advance(200);assert.deepEqual(restored.machine.snapshot(),g.machine.snapshot());
});
test('Corrupt, incompatible and other-game native saves are rejected',()=>{
 const saved=new ZabyGame().snapshot();for(const bad of [null,{...saved,game:'auto'},{...saved,version:2},{...saved,ticks:-1},{...saved,machine:{...saved.machine,ram:[]}}])assert.equal(ZabyGame.restore(bad),null);
});
test('Original missed jumps consume the native frog stock and reach the original game-over branch',()=>{
 const g=new ZabyGame();g.start();g.turn('newFrog');g.turn('up');let elapsed=0;const counts=new Set([g.lives]);
 while(g.state==='playing'&&elapsed<30000){g.advance(100);g.takeEvents();elapsed+=100;counts.add(g.lives);}
 assert.equal(g.state,'over');assert.equal(g.lives,0);assert.ok(counts.size>=7);assert.equal(g.machine.cpu.pc,0x7b65);assert.ok(g.machine.columns.every(n=>n===0));
 const cycles=g.machine.cpu.cycles;g.advance(1000);assert.equal(g.machine.cpu.cycles,cycles);assert.equal(ZabyGame.restore(g.snapshot()).state,'over');
});
