import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Game} from '../src/engine.js';
import {decideEnemy,enemyField} from '../src/enemy-ai.js';
const room=(type=4)=>{
 const g=new Game({walls:[],objects:[{type,x:15,y:10}]});
 Object.assign(g.player,{x:25,y:15});return g;
};
const step=g=>{for(let i=0;i<5;i++)g.tick()};
test('Enemy decisions match 256 saved results executed by the original PMD code',()=>{
 const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/pmd-enemy-decisions.json',import.meta.url)));
 assert.equal(fixtures.length,256);
 for(const [index,f]of fixtures.entries()){
  const g=room(f.enemy.type==='frog'?4:5);Object.assign(g.player,f.player);Object.assign(g.enemies[0],f.enemy);
  g.enemies.push(...f.others);g.rocks=f.rocks;g.mushrooms=f.mushrooms;
  for(const [x,y]of f.walls)g.walls.add(`${x},${y}`);
  const e=g.enemies[0],shared={turn:f.turn};let i=0;
  const decision=decideEnemy(e,g.player,enemyField(g,e),()=>f.bytes[i++],shared);
  assert.deepEqual(JSON.parse(JSON.stringify({decision,pathSteps:e.pathSteps,turn:shared.turn})),f.expected,'Native case '+index);
 }
});
test('Ghost sees Flappy in its own row and does not detect him through a wall or in another row',()=>{
 for(const scenario of ['visible','wall','different row']){
  const g=room(5),e=g.enemies[0];g.random=()=>0;
  Object.assign(g.player,{x:8,y:scenario==='different row'?6:10});
  if(scenario==='wall')g.walls.add('12,10');
  step(g);assert.equal(e.x,scenario==='visible'?14:16);assert.equal(e.y,10);
 }
});
test('Ghost scans ten cells from its leading edge and uses the random low bit when no player is found',()=>{
 for(const [x,byte,expected]of [[5,0,14],[3,0,16],[25,255,16],[27,255,14]]){
  const g=room(5);Object.assign(g.player,{x,y:10});g.random=()=>byte/256;
  step(g);assert.equal(g.enemies[0].x,expected);
 }
});
test('A fresh frog chooses an axis and heads towards the actual player position',()=>{
 for(const [byte,x,y]of [[0,16,10],[255,15,11]]){
  const g=room();g.random=()=>byte/256;step(g);assert.deepEqual([g.enemies[0].x,g.enemies[0].y],[x,y]);
 }
});
test('Frog continues a counted trajectory before choosing a new axis',()=>{
 const g=room(),e=g.enemies[0];Object.assign(e,{dx:0,dy:-1,pathSteps:3});g.random=()=>0;
 for(let left=2;left>=0;left--){step(g);assert.equal(e.pathSteps,left);assert.equal(e.x,15)}
 assert.equal(e.y,7);step(g);assert.equal(e.x,16);assert.equal(e.y,7);
});
test('An aligned frog starts the original four-step pursuit',()=>{
 const g=room(),e=g.enemies[0];g.player.y=10;g.random=()=>255/256;
 step(g);assert.equal(e.x,16);assert.equal(e.pathSteps,4);
 g.player.y=16;step(g);assert.equal(e.x,17);assert.equal(e.pathSteps,3);
});
test('A blocked fresh frog can retry the other axis instead of automatically reversing',()=>{
 const g=room(),e=g.enemies[0];Object.assign(g.player,{x:5,y:5});g.walls.add('14,10');g.random=()=>0;
 step(g);assert.deepEqual([e.x,e.y],[15,9]);assert.equal(g.enemyAI.turn,0xe0);
});
test('With both axes blocked the frog waits and selects its native random path length and idle pose',()=>{
 const g=room(),e=g.enemies[0];Object.assign(g.player,{x:5,y:5});
 g.walls.add('14,10');g.walls.add('15,9');const bytes=[0,3,255];g.random=()=>bytes.shift()/256;
 step(g);assert.deepEqual([e.x,e.y,e.dx,e.dy,e.pathSteps],[15,10,-1,0,3]);assert.equal(e.stepTick,undefined);
});
test('Enemy movement retains the existing five-tick rhythm and sleeping/paused enemies do not decide',()=>{
 const g=room(5),e=g.enemies[0];g.random=()=>0;
 for(let i=0;i<4;i++){g.tick();assert.equal(e.x,15)}g.tick();assert.equal(e.x,16);assert.equal(e.stepTick,5);
 e.sleep=5;step(g);assert.equal(e.x,16);assert.equal(e.sleep,0);
 g.state='paused';const frozen=JSON.stringify(g.enemies);step(g);assert.equal(JSON.stringify(g.enemies),frozen);
});
test('Native scan order gives the same trajectories even if level objects are listed in reverse order',()=>{
 const level={walls:[],objects:[{type:4,x:15,y:10},{type:5,x:8,y:7},{type:4,x:20,y:10}]};
 const a=new Game(level),b=new Game({...level,objects:[...level.objects].reverse()});
 Object.assign(a.player,{x:25,y:15});Object.assign(b.player,{x:25,y:15});
 const states=g=>[...g.enemies].sort((x,y)=>x.type.localeCompare(y.type)||x.x-y.x||x.y-y.y);
 for(let i=0;i<20;i++){step(a);step(b);assert.deepEqual(states(a),states(b));assert.deepEqual(a.enemyAI,b.enemyAI);assert.equal(a.state,b.state)}
});
test('The native ghost detects a resting mushroom without moving through it, preserving the existing sleep duration',()=>{
 const g=room(5),e=g.enemies[0];g.mushrooms.push({x:17,y:10,w:1,h:1});g.random=()=>0;
 step(g);assert.equal(e.x,15);assert.equal(e.sleep,60);assert.equal(g.mushrooms.length,0);assert.equal(g.event,'sleep');
});
test('Native probes include the target platform rather than treating it as empty space',()=>{
 const g=room();g.goal={x:17,y:10,w:2,h:1};const field=enemyField(g,g.enemies[0]);
 assert.equal(field.read(2,0),63);assert.equal(field.read(3,8),64);
 g.enemies[0].dx=1;g.enemies[0].dy=0;g.enemies[0].pathSteps=2;g.random=()=>0;
 step(g);assert.equal(g.enemies[0].x,15);assert.equal(g.enemies[0].stepTick,undefined);
});
