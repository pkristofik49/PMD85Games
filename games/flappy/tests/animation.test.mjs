import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/engine.js';
import {playerSprite,playerPose,enemySprite} from '../src/render.js';
import {sprites} from '../assets/game-data.js';

const empty=()=>new Game({walls:[],objects:[]});
test('Flappy uses the native flattened 12 by 8 bitmap at the bottom of his cell after death',()=>{
 const game=empty();game.die('death.enemy');
 const pose=playerPose(game.player);
 assert.equal(pose.data,sprites.playerCrushed);assert.equal(pose.data.length,16);
 assert.deepEqual({width:pose.width,height:pose.height,x:pose.x,y:pose.y},{width:2,height:8,x:0,y:8});
});
const directions=[['left',-1,0],['right',1,0],['up',0,-1],['down',0,1]];

test('Walking cycles through directional poses with their full native dimensions',()=>{
 for(const [name,dx,dy]of directions){
  const game=empty();game.player.x=12;game.player.y=10;
  const poses=[];
  for(let step=0;step<4;step++){
   assert.equal(game.move(dx,dy),true,name);
   const pose=playerSprite(game.player);
   const visual=playerPose(game.player);
   assert.equal(pose.length,visual.width*visual.height,name);
   assert.equal(visual.height,16,name);
   assert.equal(visual.width,dx&&game.player.walkFrame%2?3:2,name);
   assert.ok(pose.every(byte=>Number.isInteger(byte)&&byte>=0&&byte<64),name);
   poses.push(JSON.stringify(pose));
   game.tick();
  }
  assert.equal(new Set(poses).size,dx?2:4,name);
 }
});

test('Sideways walking uses unchanged PMD bitmaps instead of generated leg shapes',()=>{
 for(const [name,dx]of [['left',-1],['right',1]]){
  for(let frame=0;frame<4;frame++){
   const p={dx,dy:0,walking:true,walkFrame:frame};
   const pose=playerPose(p);
   assert.equal(pose.data,sprites[frame%2?name+'Step':name]);
   assert.equal(pose.x,frame%2&&dx>0?-6:0);
  }
 }
});

test('Standing still returns to the original pose and stays still as the world advances',()=>{
 for(const [name,dx,dy]of directions){
  const game=empty();game.player.x=12;game.player.y=10;game.move(dx,dy);
  game.tick();game.tick();
  assert.equal(game.player.walking,false,name);
  const idle=playerSprite(game.player);
  assert.deepEqual(idle,sprites[name==='up'?'back':name==='down'?'front':name]);
  for(let i=0;i<8;i++){game.tick();assert.deepEqual(playerSprite(game.player),idle)}
 }
});

test('A blocked move stops the gait without consuming a step',()=>{
 const game=empty();game.move(1,0);
 const step=game.player.walkFrame;
 assert.equal(game.move(0,-1),false);
 assert.equal(game.player.walkFrame,step);
 assert.equal(game.player.walking,false);
 assert.deepEqual(playerSprite(game.player),sprites.back);
});

test('Changing direction starts a new gait facing the new direction',()=>{
 const game=empty();game.player.x=12;game.player.y=10;
 for(const [,dx,dy]of directions){
  game.move(dx,dy);
  assert.equal(game.player.walkFrame,1);
  assert.equal(game.player.dx,dx);assert.equal(game.player.dy,dy);
 }
});

test('Frogs have distinct original idle and hopping graphics in all four directions',()=>{
 const idlePoses=new Set(),hoppingPoses=new Set();
 for(const [name,dx,dy]of directions){
  const frog={type:'frog',dx,dy,sleep:0};
  const idle=enemySprite(frog,0);
  const expected=name==='down'?sprites.frog:sprites['frog'+name[0].toUpperCase()+name.slice(1)];
  assert.deepEqual(idle.data,expected,name);
  idlePoses.add(JSON.stringify(idle.data));
  frog.stepTick=5;
  const hop=enemySprite(frog,5);
  assert.equal(hop.data.length,hop.width*hop.height);
  assert.equal(hop.data.length,48,'The extended hopping pose must not be cropped');
  assert.deepEqual([hop.width,hop.height],dx?[3,16]:[2,24]);
  assert.notDeepEqual(hop.data,idle.data,name);
  hoppingPoses.add(JSON.stringify(hop.data));
  assert.deepEqual(enemySprite(frog,7),idle,'A completed hop returns to the directional idle pose');
  frog.sleep=10;assert.deepEqual(enemySprite(frog,5),idle,'Sleeping frogs do not hop');
 }
 assert.equal(idlePoses.size,4);assert.equal(hoppingPoses.size,4);
});

test('Frog hopping starts only on a successful move and stops when a wall blocks it',()=>{
 const game=new Game({walls:[[13,10]],objects:[{type:4,x:10,y:10}]});
 game.random=()=>1;
 const frog=game.enemies[0];frog.dx=1;frog.dy=0;frog.pathSteps=3;
 for(let i=0;i<5;i++)game.tick();
 assert.equal(frog.x,11);
 assert.equal(frog.stepTick,5);
 assert.equal(enemySprite(frog,game.ticks).data.length,48);
 for(let i=0;i<5;i++)game.tick();
 assert.equal(frog.x,11);
 assert.equal(frog.dx,0);assert.equal(frog.dy,1);
 assert.equal(frog.stepTick,undefined);
 assert.deepEqual(enemySprite(frog,game.ticks).data,sprites.frog);
});

test('The ghost keeps facing left natively and mirrors only when moving right',()=>{
 for(const dx of [-1,1]){
  const pose=enemySprite({type:'ghost',dx,dy:0,sleep:0},0);
  assert.equal(pose.data,sprites.ghost);assert.equal(pose.flip,dx>0);
 }
});

test('Crushed frogs and ghosts use the original flattened 12 by 8 bitmap',()=>{
 for(const type of ['frog','ghost']){
  const corpse=enemySprite({type,crushed:true},0);
  assert.equal(corpse.data,sprites[type+'Crushed']);
  assert.equal(corpse.data.length,16);assert.equal(corpse.width,2);assert.equal(corpse.height,8);
  assert.equal(corpse.flip,false);
 }
});
