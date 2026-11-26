import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import '../assets/pampuch-native.js';import '../assets/saboter-native.js';import '../js/i8080.js';import '../js/pmd85.js';import '../js/saboter.js';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function callNative(m,address){m.cpu.sp-=2;m.memory[m.cpu.sp]=0xc0;m.memory[m.cpu.sp+1]=0x72;m.cpu.pc=address;m.until(0x72c0,16000000);m.targetCycles=m.cpu.cycles;m.edges=[];}
test('SABO +4 retains the archived program, original menu and native PIO music',()=>{
 assert.equal(SaboterNativeData.program.length,32768);assert.equal(hash(SaboterNativeData.program),SaboterNativeData.programSha256);
 const g=new SaboterGame();assert.equal(g.state,'ready');assert.equal(g.machine.cpu.pc,0x25a1);assert.ok(g.machine.memory.subarray(0xc000).some(n=>n));g.advance(500);assert.ok(g.takeEvents().some(e=>e.edges.length>100));assert.equal(g.state,'ready');assert.equal(g.machine.result,null);
});
test('Starting uses the native zero/menu input and good-luck wait without patching game instructions',()=>{
 const g=new SaboterGame();g.advance(200);g.start();assert.equal(g.state,'playing');assert.equal(g.machine.cpu.pc,0x72c0);assert.equal(g.energy,8);assert.equal(g.machine.word(0x67a8),0x600a);assert.equal(g.machine.word(0x6aed),0x6aef);assert.ok(g.machine.columns.every(n=>n===0));assert.equal(g.takeEvents().length,0);
});
test('All five browser controls reach the native active-low keyboard table and release cleanly',()=>{
 const g=new SaboterGame();g.start();
 for(const [direction,column,mask,bit]of [['left',12,4,8],['right',14,4,4],['up',2,4,2],['down',1,16,1],['action',10,16,16]]){
  g.turn(direction);g.machine.portA=column;assert.equal(g.machine.input(0xf5)&mask,0);callNative(g.machine,0x6aec);assert.equal(g.machine.cpu.r[7],bit);g.release();assert.equal(g.machine.input(0xf5)&mask,mask);assert.equal(g.machine.input(0xf5)&0x40,0x40,'Native abort SHIFT stays released');
 }
});
test('Native walking, crouching and direction-plus-up jumping produce distinct original poses and coordinates',()=>{
 const variants=[];
 for(const directions of [['left'],['right'],['down'],['right','up']]){const g=new SaboterGame();g.start();g.advance(1000);for(const direction of directions)g.turn(direction);g.advance(100);variants.push([g.machine.word(0x6a6d),g.machine.memory[0x7188],g.machine.memory[0x7199]]);}
 assert.equal(new Set(variants.map(v=>JSON.stringify(v))).size,4);assert.ok(variants[0][0]<variants[1][0]);assert.equal(variants[3][2],2,'Native right-jump sequence is active');
});
test('Native room transitions load original scenery and opponents during a continuous rightward route',()=>{
 const g=new SaboterGame();g.start();g.turn('right');const rooms=new Set(),frames=new Set();
 for(let n=0;n<12;n++){g.advance(1000);g.takeEvents();rooms.add(g.machine.word(0x67a8));frames.add(hash(g.machine.memory.subarray(0xc000)));}
 assert.ok(rooms.size>=4);assert.ok(frames.size>=8);assert.equal(g.state,'playing');
});
test('Native interaction transfers a grenade from its room into an empty inventory slot',()=>{
 const g=new SaboterGame();g.start();const m=g.machine,item=m.word(0x67a8)+3;
 // Place an original item in the native room field, then execute native pickup.
 m.memory[item]=0x81;g.turn('action');callNative(m,0x6ddb);assert.equal(m.memory[item],0x80);assert.equal(m.memory[0x6dc1],0x81);assert.equal(m.memory[0x6dc2],0x80);
});
test('Title music and gameplay are invariant under browser frame partitioning',()=>{
 const a=new SaboterGame(),b=new SaboterGame();a.advance(500);for(let i=0;i<50;i++)b.advance(10);assert.deepEqual(a.machine.snapshot(),b.machine.snapshot());assert.deepEqual(a.takeEvents().flatMap(e=>e.edges),b.takeEvents().flatMap(e=>e.edges));
 a.start();b.start();for(const g of [a,b]){g.turn('right');g.turn('up');}a.advance(500);for(let i=0;i<50;i++)b.advance(10);assert.deepEqual(a.machine.snapshot(),b.machine.snapshot());assert.deepEqual(a.takeEvents().flatMap(e=>e.edges),b.takeEvents().flatMap(e=>e.edges));
});
test('Native energy exhaustion, timeout, wrong code and successful escape draw their own final messages',()=>{
 const frames=new Set();
 for(const outcome of [12,10,11,6]){const g=new SaboterGame();g.start();const m=g.machine;
  // Exercise native outcome branches; this fixture is not a complete playthrough.
  if(outcome===12){m.memory[0x7253]=0;m.cpu.pc=0x7905;}
  if(outcome===10){m.memory.fill(0,0x718e,0x7193);m.cpu.pc=0x790f;}
  if(outcome===11){m.memory[0x6dc5]=0x88;m.memory[0x66e0]=0x90;m.memory[0x6a6d]=0x20;m.cpu.pc=0x767f;}
  if(outcome===6)m.cpu.pc=0x732a;
  for(let n=0;n<60&&g.state==='playing';n++){g.advance(1000);g.takeEvents();}
  assert.equal(g.state,outcome===6?'won':'over');assert.equal(m.result,outcome);assert.equal(m.cpu.pc,0x26ac);frames.add(hash(m.memory.subarray(0xc000)));assert.equal(SaboterGame.restore(g.snapshot()).state,g.state);
  const cycles=m.cpu.cycles;g.advance(1000);assert.equal(m.cpu.cycles,cycles);
 }assert.equal(frames.size,4);
});
test('Saves preserve title phase, CPU, RAM and result; active play restores paused with released controls',()=>{
 const g=new SaboterGame();g.advance(300);const title=SaboterGame.restore(JSON.parse(JSON.stringify(g.snapshot())));assert.equal(title.state,'ready');assert.deepEqual(title.machine.snapshot(),g.machine.snapshot());g.advance(200);title.advance(200);assert.deepEqual(title.machine.snapshot(),g.machine.snapshot());
 g.start();g.turn('right');g.advance(400);const restored=SaboterGame.restore(g.snapshot());assert.equal(restored.state,'paused');assert.deepEqual(restored.machine.snapshot(),g.machine.snapshot());assert.ok(restored.machine.columns.every(n=>n===0));const cycles=restored.machine.cpu.cycles;restored.advance(1000);assert.equal(restored.machine.cpu.cycles,cycles);
 for(const bad of [null,{...g.snapshot(),game:'manic2'},{...g.snapshot(),version:2},{...g.snapshot(),result:99},{...g.snapshot(),ticks:-1},{...g.snapshot(),machine:{...g.snapshot().machine,ram:[]}}])assert.equal(SaboterGame.restore(bad),null);
});
