import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import '../assets/pampuch-native.js';import '../assets/manic2-native.js';import '../js/i8080.js';import '../js/pmd85.js';import '../js/manic2.js';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function callNative(m,address){m.cpu.sp-=2;m.memory[m.cpu.sp]=1;m.memory[m.cpu.sp+1]=0x19;m.cpu.pc=address;m.until(0x1901,64000000);m.targetCycles=m.cpu.cycles;m.edges=[];}
test('MANIC2+3 retains the archived program, native overview and original title audio',()=>{
 assert.equal(Manic2NativeData.program.length,32768);assert.equal(hash(Manic2NativeData.program),Manic2NativeData.programSha256);
 const g=new Manic2Game();assert.equal(g.machine.cpu.pc,0x0238);assert.equal(g.state,'ready');assert.ok(g.machine.memory.subarray(0xc000).some(n=>n));
 g.advance(500);assert.ok(g.takeEvents().some(e=>e.edges.length>100));assert.equal(g.state,'ready');
});
test('Normal and training starts use original inputs, room two and nine total lives',()=>{
 for(const training of [false,true]){const g=new Manic2Game();g.training=training;g.start();assert.equal(g.machine.memory[0x234f],training?0x54:0x89);assert.equal(g.level,2);assert.equal(g.lives,9);assert.equal(g.keys,0);assert.equal(g.machine.cpu.pc,0x1901);assert.ok(g.machine.columns.every(n=>n===0));assert.equal(g.machine.jump,false);}
});
test('Walking and direction-plus-SHIFT jump select four distinct native key codes',()=>{
 const positions=[];
 for(const [direction,jump,code] of [['left',false,0x83],['right',false,0x85],['left',true,0x8e],['right',true,0x94]]){
  const g=new Manic2Game();g.start();g.turn(direction);if(jump)g.turn('action');g.advance(300);assert.equal(g.machine.memory[0x1d8d],code);positions.push(g.machine.word(0x594));
  g.machine.portA=direction==='left'?12:14;assert.equal(g.machine.input(0xf5)&0x40,0x40,'Right SHIFT must stay released');g.release();assert.equal(g.machine.input(0xf5)&0x20,0x20);
 }assert.equal(new Set(positions).size,4);
});
test('Native title and gameplay are invariant under browser frame partitioning',()=>{
 const a=new Manic2Game(),b=new Manic2Game();a.advance(500);for(let i=0;i<50;i++)b.advance(10);assert.deepEqual(a.machine.snapshot(),b.machine.snapshot());assert.deepEqual(a.takeEvents().flatMap(e=>e.edges),b.takeEvents().flatMap(e=>e.edges));
 a.start();b.start();for(const g of [a,b]){g.turn('right');g.turn('action');}a.advance(500);for(let i=0;i<50;i++)b.advance(10);assert.deepEqual(a.machine.snapshot(),b.machine.snapshot());assert.deepEqual(a.takeEvents().flatMap(e=>e.edges),b.takeEvents().flatMap(e=>e.edges));
});
test('The original loader addresses all twenty-two distinct room matrices',()=>{
 const g=new Manic2Game();g.start();const rooms=new Set();
 // Invoke native room loading with a room-number fixture, not a full playthrough.
 for(let room=1;room<=22;room++){g.machine.memory[0x1d38]=room;callNative(g.machine,0x1d3b);assert.equal(g.machine.word(0x1d39),0x24d6+(room-1)*792);rooms.add(hash(g.machine.memory.subarray(0x132,0x132+792)));}assert.equal(rooms.size,22);
});
test('Native deaths exhaust all normal lives while training retains its stock',()=>{
 const normal=new Manic2Game(),training=new Manic2Game();normal.start();training.training=true;training.start();
 for(let expected=8;expected>=1;expected--){normal.machine.cpu.pc=0x1806;normal.machine.until(0x1901,32000000);assert.equal(normal.lives,expected);training.machine.cpu.pc=0x1806;training.machine.until(0x1901,32000000);assert.equal(training.lives,9);}
 normal.machine.cpu.pc=0x1806;normal.machine.until(0x17f0,32000000);normal.machine.targetCycles=normal.machine.cpu.cycles;normal.advance(1);assert.equal(normal.state,'over');assert.equal(normal.lives,0);assert.equal(Manic2Game.restore(normal.snapshot()).state,'over');
});
test('The archived timer expires in both modes, including training',()=>{
 for(const training of [false,true]){const g=new Manic2Game();g.training=training;g.start();const m=g.machine;m.memory.fill(1,0x1f9d,0x1fa0);m.memory[0x1fa2]=0;m.cpu.pc=0x1fa3;m.targetCycles=m.cpu.cycles;g.advance(100);assert.equal(g.state,'over');assert.equal(m.cpu.pc,0x17f0);}
});
test('Native key counting reaches 139 and the original victory message precedes the won overlay',()=>{
 const g=new Manic2Game();g.start();g.machine.memory[0x201b]=8;g.machine.memory[0x201c]=3;g.machine.memory[0x201d]=1;callNative(g.machine,0x201e);assert.equal(g.keys,139);
 g.machine.cpu.pc=0x23e1;g.machine.until(0x23e8,64000000);g.machine.targetCycles=g.machine.cpu.cycles;g.advance(1);assert.equal(g.state,'won');assert.equal(Manic2Game.restore(g.snapshot()).state,'won');
});
test('Complete native saves restore title phase and mode; active play resumes paused with released keys',()=>{
 const intro=new Manic2Game();intro.training=true;intro.advance(100);const saved=Manic2Game.restore(JSON.parse(JSON.stringify(intro.snapshot())));assert.equal(saved.training,true);assert.equal(saved.state,'ready');assert.deepEqual(saved.machine.snapshot(),intro.machine.snapshot());
 intro.advance(200);saved.advance(200);assert.deepEqual(saved.machine.snapshot(),intro.machine.snapshot());
 intro.start();intro.turn('right');intro.turn('action');intro.advance(300);const restored=Manic2Game.restore(intro.snapshot());assert.equal(restored.state,'paused');assert.equal(restored.training,true);assert.deepEqual(restored.machine.snapshot(),intro.machine.snapshot());assert.equal(restored.machine.jump,false);assert.ok(restored.machine.columns.every(n=>n===0));
 const cycles=restored.machine.cpu.cycles;restored.advance(500);assert.equal(restored.machine.cpu.cycles,cycles);
 for(const bad of [null,{...intro.snapshot(),game:'manic'},{...intro.snapshot(),training:null},{...intro.snapshot(),introFinished:null},{...intro.snapshot(),machine:{...intro.snapshot().machine,ram:[]}}])assert.equal(Manic2Game.restore(bad),null);
});
