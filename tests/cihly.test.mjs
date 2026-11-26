import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import '../assets/pampuch-native.js';import '../assets/cihly-native.js';import '../js/i8080.js';import '../js/pmd85.js';import '../js/cihly.js';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
test('Cihly loads the exact ZED tape program and pauses its initial board with three balls',()=>{
 assert.equal(hash(CihlyNativeData.program),CihlyNativeData.programSha256);assert.equal(CihlyNativeData.program.length,1121);
 const g=new CihlyGame();assert.equal(g.state,'ready');assert.equal(g.machine.cpu.pc,0x13e0);assert.equal(g.lives,3);assert.equal(g.score,0);
 assert.equal(g.highScore,9,'Preserve the archived native header bytes');const before=g.machine.snapshot();g.advance(1000);assert.deepEqual(g.machine.snapshot(),before);assert.equal(g.takeEvents().length,0);
});
test('Left EOL and V inputs steer the native paddle and respect its original screen limits',()=>{
 const left=new CihlyGame(),right=new CihlyGame();left.start();right.start();left.turn('left');right.turn('right');left.advance(500);right.advance(500);
 assert.ok(left.machine.memory[0x12a6]<right.machine.memory[0x12a6]);left.machine.portA=4;right.machine.portA=4;assert.equal(left.machine.input(0xf5)&32,0);assert.equal(right.machine.input(0xf5)&16,0);
 left.advance(2000);right.advance(2000);assert.equal(left.machine.memory[0x12a6],0);assert.equal(right.machine.memory[0x12a6],43);
 left.release();right.release();assert.equal(left.machine.input(0xf5)&32,32);assert.equal(right.machine.input(0xf5)&16,16);
});
test('The original ball collision erases brick pixels, adds points and emits native sound',()=>{
 const g=new CihlyGame();const brickBytes=()=>{let n=0;for(let y=50;y<116;y++)for(let x=0;x<48;x++)if(g.machine.memory[0xc000+y*64+x])n++;return n;};
 const before=brickBytes();g.start();g.advance(5000);assert.ok(g.machine.memory[0x12a8]>0);assert.ok(g.score>=10);assert.ok(brickBytes()<before);assert.ok(g.takeEvents().some(e=>e.edges.length>0));
});
test('Cihly CPU, framebuffer and sound are independent of animation frame partitioning',()=>{
 const a=new CihlyGame(),b=new CihlyGame();a.start();b.start();a.turn('right');b.turn('right');a.advance(500);for(let i=0;i<50;i++)b.advance(10);
 assert.deepEqual(a.machine.snapshot(),b.machine.snapshot());assert.deepEqual(a.takeEvents().flatMap(e=>e.edges),b.takeEvents().flatMap(e=>e.edges));
});
test('Missing the ball consumes all three native balls before the original K0 wait',()=>{
 const g=new CihlyGame();g.start();let elapsed=0;const counts=new Set([g.lives]);
 while(g.state==='playing'&&elapsed<120000){g.advance(500);g.takeEvents();elapsed+=500;counts.add(g.lives);}
 assert.equal(g.state,'over');assert.deepEqual([...counts],[3,2,1,0]);assert.equal(g.machine.cpu.pc,0x12cf);assert.equal(g.lives,0);
 const cycles=g.machine.cpu.cycles;g.advance(1000);assert.equal(g.machine.cpu.cycles,cycles);assert.equal(CihlyGame.restore(g.snapshot()).state,'over');
});
test('Native restart updates and preserves the native high score across attempts and reloads',()=>{
 const g=new CihlyGame();g.start();g.advance(5000);const score=g.score;assert.ok(score>g.highScore);g.restart();assert.equal(g.state,'playing');assert.equal(g.score,0);assert.equal(g.highScore,score);assert.equal(g.lives,3);
 const r=CihlyGame.restore(JSON.parse(JSON.stringify(g.snapshot())));assert.equal(r.highScore,score);r.restart();assert.equal(r.highScore,score);assert.equal(r.score,0);
});
test('The original completion animation grants its bonus and advances to the next wall',()=>{
 const g=new CihlyGame();g.start();const m=g.machine.memory,stage=g.machine.word(0x12a9);
 // Fixture: reach the native 47-hit completion branch. Keep all instructions,
 // bonus animation, stock handling and wall setup untouched.
 m[0x12a8]=47;m[0x129a]=47;m[0x129b]=0;m.set(Buffer.from('0470'),0x132c);g.machine.cpu.pc=0x125b;g.machine.until(0x13e0);g.machine.targetCycles=g.machine.cpu.cycles;
 assert.equal(g.score,770);assert.equal(g.lives,3);assert.equal(m[0x12a8],0);assert.equal(g.machine.word(0x12a9),stage+1);
});
test('Saves retain CPU, RAM, native record and sound phase; restore pauses and releases controls',()=>{
 const g=new CihlyGame();g.start();g.turn('left');g.advance(500);const saved=g.snapshot(),r=CihlyGame.restore(JSON.parse(JSON.stringify(saved)));
 assert.equal(r.state,'paused');assert.deepEqual(r.machine.snapshot(),g.machine.snapshot());assert.equal(r.machine.steerLeft,false);assert.ok(r.machine.columns.every(n=>n===0));
 const cycles=r.machine.cpu.cycles;r.advance(1000);assert.equal(r.machine.cpu.cycles,cycles);g.release();r.state='playing';g.advance(200);r.advance(200);assert.deepEqual(r.machine.snapshot(),g.machine.snapshot());
 for(const bad of [null,{...saved,game:'auto'},{...saved,version:2},{...saved,ticks:-1},{...saved,machine:{...saved.machine,ram:[]}}])assert.equal(CihlyGame.restore(bad),null);
});
