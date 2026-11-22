import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import '../assets/pampuch-native.js';import '../assets/manic-native.js';import '../js/i8080.js';import '../js/pmd85.js';import '../js/manic.js';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
test('MANIC+ imports the PMD 85-1 program and draws the original title before its tune',()=>{
 assert.equal(hash(ManicNativeData.program),ManicNativeData.programSha256);assert.equal(ManicNativeData.program.length,32768);
 const g=new ManicGame();assert.equal(g.state,'ready');assert.equal(g.machine.cpu.pc,0x34a1);assert.equal(g.introFinished,false);
 assert.ok(g.machine.memory.subarray(0xc000).some(n=>n!==0));
});
test('The native title tune produces original PIO edges and freezes before attract mode',()=>{
 const g=new ManicGame();g.advance(500);assert.ok(g.takeEvents().some(e=>e.edges.length>100));
 for(let i=0;i<30&&!g.introFinished;i++){g.advance(1000);g.takeEvents();}
 assert.equal(g.introFinished,true);assert.equal(g.state,'ready');assert.equal(g.machine.cpu.pc,0x7c66);
 const cycles=g.machine.cpu.cycles;g.advance(1000);assert.equal(g.machine.cpu.cycles,cycles);assert.ok(ManicGame.restore(g.snapshot()));
});
test('Starting uses the original STOP input to select human play with eight lives and cavern one',()=>{
 const g=new ManicGame();g.advance(500);g.start();assert.equal(g.state,'playing');assert.equal(g.level,1);assert.equal(g.lives,8);
 assert.equal(g.machine.memory[0x7e89],0,'Native human mode');assert.equal(g.machine.cpu.pc,0x7ce1);assert.ok(g.machine.columns.every(n=>n===0));assert.equal(g.takeEvents().length,0);
 g.turn('left');g.machine.portA=12;assert.equal(g.machine.input(0xf5)&4,0);g.turn('action');assert.equal(g.machine.input(0xf5)&32,0);
 g.release();assert.equal(g.machine.input(0xf5)&32,32);assert.equal(g.machine.input(0xf5)&4,4);
});
test('Native left/right walking and SHIFT jumping change the original player coordinates and sound',()=>{
 const left=new ManicGame(),right=new ManicGame(),jump=new ManicGame();for(const g of [left,right,jump])g.start();
 left.turn('left');right.turn('right');jump.turn('right');jump.turn('action');for(const g of [left,right,jump])g.advance(500);
 assert.ok(left.machine.memory[0x7e28]<right.machine.memory[0x7e28]);assert.notEqual(jump.machine.memory[0x1d9b],right.machine.memory[0x1d9b]);assert.ok(jump.takeEvents().some(e=>e.edges.length>0));
});
test('Title music and gameplay stay independent of browser frame partitioning',()=>{
 const a=new ManicGame(),b=new ManicGame();a.advance(500);for(let i=0;i<50;i++)b.advance(10);assert.deepEqual(a.machine.snapshot(),b.machine.snapshot());
 assert.deepEqual(a.takeEvents().flatMap(e=>e.edges),b.takeEvents().flatMap(e=>e.edges));
 a.start();b.start();a.turn('right');b.turn('right');a.turn('action');b.turn('action');a.advance(500);for(let i=0;i<50;i++)b.advance(10);
 assert.deepEqual(a.machine.snapshot(),b.machine.snapshot());assert.deepEqual(a.takeEvents().flatMap(e=>e.edges),b.takeEvents().flatMap(e=>e.edges));
});
test('The native transition loads all twenty caverns and loops after its original victory screen',()=>{
 const g=new ManicGame();g.start();const screens=new Set([hash(g.machine.memory.subarray(0xc000))]);
 // Exercise the original completion branch, without replacing a room loader,
 // object rule or instruction. This fixture does not claim a full playthrough.
 for(let level=2;level<=20;level++){g.machine.cpu.pc=0x7c80;g.machine.until(0x7ce1);g.machine.targetCycles=g.machine.cpu.cycles;g.machine.edges=[];assert.equal(g.level,level);screens.add(hash(g.machine.memory.subarray(0xc000)));}
 assert.equal(screens.size,20);const speed=g.machine.word(0x7e8d);
 g.machine.cpu.pc=0x7c80;g.machine.until(0x84a1);g.machine.columns[14]=2;g.machine.until(0x84d9);g.release();g.machine.until(0x7ce1);
 assert.equal(g.level,1);assert.equal(g.machine.word(0x7e8d),Math.floor(speed/2));
});
test('Native oxygen exhaustion consumes every life and stops after the last original death routine',()=>{
 const g=new ManicGame();g.start();let elapsed=0;const lives=new Set([g.lives]);
 while(g.state==='playing'&&elapsed<1200000){g.advance(1000);g.takeEvents();elapsed+=1000;lives.add(g.lives);}
 assert.equal(g.state,'over');assert.deepEqual([...lives],[8,7,6,5,4,3,2,1,0]);assert.equal(g.machine.cpu.pc,0x7da4);assert.equal(ManicGame.restore(g.snapshot()).state,'over');
});
test('Native saves preserve intro position, CPU, RAM and divider phase; active play restores paused',()=>{
 const intro=new ManicGame();intro.advance(300);const restoredIntro=ManicGame.restore(JSON.parse(JSON.stringify(intro.snapshot())));
 assert.equal(restoredIntro.state,'ready');assert.deepEqual(restoredIntro.machine.snapshot(),intro.machine.snapshot());intro.advance(200);restoredIntro.advance(200);assert.deepEqual(restoredIntro.machine.snapshot(),intro.machine.snapshot());
 const g=new ManicGame();g.start();g.turn('action');g.turn('right');g.advance(400);const r=ManicGame.restore(JSON.parse(JSON.stringify(g.snapshot())));
 assert.equal(r.state,'paused');assert.deepEqual(r.machine.snapshot(),g.machine.snapshot());assert.equal(r.machine.jump,false);assert.ok(r.machine.columns.every(n=>n===0));
 const cycles=r.machine.cpu.cycles;r.advance(500);assert.equal(r.machine.cpu.cycles,cycles);g.release();r.state='playing';g.advance(200);r.advance(200);assert.deepEqual(r.machine.snapshot(),g.machine.snapshot());
});
test('Corrupt or other-game saves are rejected instead of executing an incompatible program',()=>{
 const saved=new ManicGame().snapshot();for(const bad of [null,{...saved,game:'zaby'},{...saved,version:2},{...saved,introFinished:null},{...saved,ticks:-1},{...saved,machine:{...saved.machine,ram:[]}}])assert.equal(ManicGame.restore(bad),null);
});
