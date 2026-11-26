import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import '../assets/pampuch-native.js';import '../assets/invaders-native.js';import '../js/i8080.js';import '../js/pmd85.js';import '../js/invaders.js';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function callNative(m,address){m.cpu.sp-=2;m.memory[m.cpu.sp]=0xeb;m.memory[m.cpu.sp+1]=2;m.cpu.pc=address;m.until(0x02eb);m.targetCycles=m.cpu.cycles;}
test('INVADERS imports the original 1985 tape bytes and draws its native difficulty title',()=>{
 assert.equal(InvadersNativeData.address,0x100);assert.equal(InvadersNativeData.program.length,1537);assert.equal(hash(InvadersNativeData.program),InvadersNativeData.programSha256);
 const g=new InvadersGame();assert.equal(g.state,'ready');assert.equal(g.machine.cpu.pc,0x05fd);assert.ok(g.machine.memory.subarray(0xc000).some(n=>n));const cycles=g.machine.cpu.cycles;g.advance(1000);assert.equal(g.machine.cpu.cycles,cycles);assert.equal(g.takeEvents().length,0);
});
test('All five difficulty choices execute native number-key selection and configure their original spawn rates',()=>{
 const settings=[[0x047f,0x8080],[0x033f,0x8080],[0x023f,0x8080],[0x021f,0x8080],[0x0101,0x0401]];
 for(let difficulty=0;difficulty<=4;difficulty++){const g=new InvadersGame();g.difficulty=difficulty;g.start();assert.equal(g.state,'playing');assert.equal(g.machine.memory[0x03cd],difficulty);assert.equal(g.machine.word(0x03c5),settings[difficulty][0]);assert.equal(g.machine.word(0x03bb),settings[difficulty][1]);assert.equal(g.lives,3);assert.equal(g.machine.cpu.pc,0x02eb);assert.ok(g.machine.columns.every(n=>n===0));}
});
test('Native left/right movement steers the ship and fire permits just one active projectile',()=>{
 const left=new InvadersGame(),right=new InvadersGame();left.start();right.start();left.turn('left');right.turn('right');left.advance(500);right.advance(500);assert.ok(left.machine.memory[0x03b5]<right.machine.memory[0x03b5]);
 const m=left.machine;left.release();left.turn('action');m.portA=0;assert.equal(m.input(0xf5)&4,0);callNative(m,0x01c6);const shot=m.word(0x03b9);assert.notEqual(shot,0);callNative(m,0x01c6);assert.equal(m.word(0x03b9),shot);left.release();assert.equal(m.input(0xf5)&4,4);
});
test('The native collision branch removes an invader, increments BCD score and emits its original hit sound',()=>{
 const g=new InvadersGame();g.start();const m=g.machine;
 // Align an original projectile and enemy record, then run native collision code.
 m.memory[0x03b9]=20;m.memory[0x03ba]=32;m.memory[0x06e9]=20;m.memory[0x06ea]=32;callNative(m,0x026d);
 assert.equal(g.score,1);assert.equal(m.word(0x06e9),0);assert.equal(m.word(0x03b9),0);assert.ok(m.edges.length>10);
});
test('Native CPU, framebuffer and sound are independent of browser frame partitioning',()=>{
 const a=new InvadersGame(),b=new InvadersGame();for(const g of [a,b]){g.difficulty=4;g.start();g.turn('right');g.turn('action');}a.advance(1000);for(let n=0;n<100;n++)b.advance(10);assert.deepEqual(a.machine.snapshot(),b.machine.snapshot());assert.deepEqual(a.takeEvents().flatMap(e=>e.edges),b.takeEvents().flatMap(e=>e.edges));
});
test('Three real enemy breakthroughs reach the original game-over message and stop before its key wait',()=>{
 const g=new InvadersGame();g.start();const lives=new Set([g.lives]);let seconds=0;
 while(g.state==='playing'&&seconds++<300){g.advance(1000);g.takeEvents();lives.add(g.lives);}assert.equal(g.state,'over');assert.deepEqual([...lives],[3,2,1,0]);assert.equal(g.machine.cpu.pc,0x0389);assert.equal(InvadersGame.restore(g.snapshot()).state,'over');
});
test('Completing a wave runs the native animation and returns to difficulty selection; next wave retains the record',()=>{
 const g=new InvadersGame();g.start();const m=g.machine;const before=hash(m.memory.subarray(0xc000));
 // Clear native remaining/active enemies to exercise the original completion branch.
 m.memory[0x03cc]=0;m.memory.fill(0,0x06e7,0x07e7);m.memory[0x03bd]=0x45;m.memory[0x03be]=0x12;
 let edges=0;for(let n=0;n<120&&g.state==='playing';n++){g.advance(1000);edges+=g.takeEvents().flatMap(e=>e.edges).length;}
 assert.equal(g.state,'level');assert.equal(m.cpu.pc,0x05fd);assert.notEqual(hash(m.memory.subarray(0xc000)),before);assert.ok(edges>100);assert.equal(InvadersGame.restore(g.snapshot()).state,'level');
 g.difficulty=3;g.continue();assert.equal(g.state,'playing');assert.equal(g.score,0);assert.equal(g.highScore,1245);assert.equal(g.lives,3);assert.equal(m.memory[0x03cd],3);
});
test('New game uses the native restart menu and retains the highest BCD score across attempts',()=>{
 const g=new InvadersGame();g.start();g.machine.memory[0x03bd]=0x99;g.machine.memory[0x03be]=0x01;g.difficulty=2;g.restart();assert.equal(g.score,0);assert.equal(g.highScore,199);assert.equal(g.machine.memory[0x03cd],2);
 g.machine.memory[0x03bd]=0x23;g.restart();assert.equal(g.highScore,199);assert.equal(InvadersGame.restore(g.snapshot()).highScore,199);
});
test('Saves preserve ready difficulty and all machine state; active play restores paused with released controls',()=>{
 const g=new InvadersGame();g.difficulty=4;const title=InvadersGame.restore(g.snapshot());assert.equal(title.difficulty,4);assert.equal(title.state,'ready');g.start();g.turn('left');g.turn('action');g.advance(300);const restored=InvadersGame.restore(JSON.parse(JSON.stringify(g.snapshot())));assert.equal(restored.state,'paused');assert.equal(restored.difficulty,4);assert.deepEqual(restored.machine.snapshot(),g.machine.snapshot());assert.ok(restored.machine.columns.every(n=>n===0));const cycles=restored.machine.cpu.cycles;restored.advance(1000);assert.equal(restored.machine.cpu.cycles,cycles);
 for(const bad of [null,{...g.snapshot(),game:'cihly'},{...g.snapshot(),version:2},{...g.snapshot(),difficulty:5},{...g.snapshot(),difficulty:'2'},{...g.snapshot(),machine:{...g.snapshot().machine,ram:[]}}])assert.equal(InvadersGame.restore(bad),null);
});
