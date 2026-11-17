import test from 'node:test';import assert from 'node:assert/strict';
import '../assets/pampuch-native.js';import '../js/i8080.js';import '../js/pmd85.js';import '../js/pampuch.js';
test('Ready and paused games execute no instructions or sound',()=>{
 const game=new Pampuch(),before=game.machine.cpu.cycles;game.advance(1000);assert.equal(game.machine.cpu.cycles,before);game.state='paused';game.advance(1000);assert.equal(game.machine.cpu.cycles,before);assert.equal(game.takeEvents().length,0);
});
test('Native movement is not a fixed 120 ms browser tick',()=>{
 const game=new Pampuch();game.start();game.advance(100);assert.equal(game.player.x,22);game.advance(100);assert.equal(game.player.x,23);assert.equal(game.score,1);assert.equal(game.time,502);assert.equal(game.remaining,219);
});
test('Native CPU execution is independent of render frame rate',()=>{
 const a=new Pampuch(),b=new Pampuch();a.start();b.start();a.advance(1000);for(let n=0;n<100;n++)b.advance(10);
 assert.deepEqual(a.machine.cpu.snapshot(),b.machine.cpu.snapshot());assert.deepEqual(a.machine.memory,b.machine.memory);
});
test('The original keyboard matrix handles held keys and releases',()=>{
 const game=new Pampuch();game.start();game.turn('up');assert.equal(game.machine.columns[1],4);game.turn('up',false);assert.equal(game.machine.columns[1],0);game.turn('left');game.release();assert.ok(game.machine.columns.every(v=>v===0));
});
test('A native save restores every RAM byte, CPU register and sound-divider phase',()=>{
 const a=new Pampuch();a.start();a.advance(1234);const save=JSON.parse(JSON.stringify(a.snapshot()));const b=Pampuch.restore(save);assert.equal(b.state,'paused');assert.deepEqual(a.machine.snapshot(),b.machine.snapshot());b.state='playing';a.advance(250);b.advance(250);assert.deepEqual(a.machine.snapshot(),b.machine.snapshot());
});
test('Old approximate saves and corrupt native saves are rejected',()=>{
 const game=new Pampuch(),save=game.snapshot();assert.equal(Pampuch.restore({version:1}),null);for(const alter of [s=>s.machine.ram=[],s=>s.machine.cpu.pc=-1,s=>s.machine.cpu.r=[0],s=>s.machine.targetCycles=Infinity]){const bad=structuredClone(save);alter(bad);assert.equal(Pampuch.restore(bad),null);}
});
test('Game over waits for the native death routine, with no browser-imposed death delay',()=>{
 const game=new Pampuch();game.start();game.machine.memory[0xb49]=0;game.machine.memory[0xb4a]=0;game.advance(100);assert.equal(game.state,'playing');for(let i=0;i<100&&game.state==='playing';i++)game.advance(100);assert.equal(game.state,'over');assert.equal(game.lives,0);assert.equal(game.machine.cpu.pc,0x8bd);
});
test('Choosing a map uses the original menu operands with a fresh score and lives',()=>{
 const game=new Pampuch(4);assert.equal(game.map,4);assert.equal(game.level,4);assert.equal(game.score,0);assert.equal(game.lives,5);assert.deepEqual([...game.completedMaps],[]);
 assert.throws(()=>new Pampuch(12));
});
test('Completion is recorded at the native success branch, including the eleventh map',()=>{
 for(const map of [1,4,8,11]){
  const game=new Pampuch(map);game.machine.memory[0xc6c]=1;game.machine.memory[0xc6d]=0;game.start();
  for(let n=0;n<100&&!game.completedMaps.has(map);n++)game.advance(100);
  assert.deepEqual([...game.completedMaps],[map]);
  const restored=Pampuch.restore(JSON.parse(JSON.stringify(game.snapshot())));assert.deepEqual([...restored.completedMaps],[map]);
 }
});
test('Dying or merely starting a map does not mark it completed',()=>{
 const game=new Pampuch(4);game.start();game.machine.memory[0xb49]=0;game.machine.memory[0xb4a]=0;game.advance(4000);assert.equal(game.state,'over');assert.equal(game.completedMaps.size,0);
});
test('Existing native saves infer earlier completed maps; selected-map saves do not',()=>{
 const current=new Pampuch(4),save=current.snapshot();assert.deepEqual([...Pampuch.restore(save).completedMaps],[]);
 delete save.completedMaps;assert.deepEqual([...Pampuch.restore(save).completedMaps],[1,2,3]);
 save.completedMaps=[12];assert.equal(Pampuch.restore(save),null);
});
