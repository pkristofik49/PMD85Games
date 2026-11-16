import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game,CRUSH_TICKS} from '../src/engine.js';
import {levels} from '../assets/game-data.js';
const level=(objects=[],walls=[])=>({objects:[{type:2,x:15,y:10},{type:6,x:25,y:21},...objects],walls});
test('All 200 original scenes load with an accessible spawn',()=>{
 for(const[n,l]of levels.entries()){const g=new Game(l);assert.ok(!g.wallAt(g.player),`Scene ${n+1}`);assert.ok(!g.rockAt(g.player),`Scene ${n+1}`)}
});

test('Scene 2: the egg remains on its supporting stone at the start',()=>{
 const g=new Game(levels[1]);
 const egg=g.rocks.find(r=>r.egg);
 const start={x:egg.x,y:egg.y};
 for(let i=0;i<30;i++)g.tick();
 assert.deepEqual({x:egg.x,y:egg.y},start);
 assert.equal(egg.falling,false);
});

test('Supported eggs and stones never roll sideways, even with space on both sides',()=>{
 for(const type of [2,3]){
  const g=new Game({walls:[],objects:[{type,x:10,y:17},{type:3,x:10,y:19}]});
  const top=g.rocks[0];
  for(let i=0;i<10;i++)g.tick();
  assert.deepEqual({x:top.x,y:top.y},{x:10,y:17});
  assert.equal(top.falling,false);
 }
});

test('An egg falls straight down once its supporting stone is pushed away',()=>{
 const g=new Game({walls:[],objects:[{type:2,x:10,y:17},{type:3,x:10,y:19}]});
 const egg=g.rocks[0];
 g.player.x=8;g.player.y=19;
 assert.equal(g.move(1,0),true);g.tick();
 assert.equal(egg.y,17,'Partial support still holds the egg');
 assert.equal(g.move(1,0),true);
 // Step out from underneath the egg before advancing gravity.
 assert.equal(g.move(-1,0),true);assert.equal(g.move(-1,0),true);
 g.tick();
 assert.equal(egg.x,10);
 assert.equal(egg.y,18);
 assert.equal(egg.falling,true);
});
test('Player cannot move through a wall or push vertically',()=>{
 const g=new Game(level([{type:3,x:1,y:3}],[[3,1]]));assert.equal(g.move(1,0),false);assert.equal(g.move(0,1),false);assert.equal(g.player.x,1);assert.equal(g.player.y,1);
});
test('Horizontal push moves a stone, a blocked ordinary stone breaks',()=>{
 const g=new Game(level([{type:3,x:3,y:1}],[[6,1]]));assert.equal(g.move(1,0),true);assert.equal(g.rocks.find(r=>!r.egg).x,4);assert.equal(g.move(1,0),false);assert.equal(g.rocks.filter(r=>!r.egg).length,0);
});

test('Pushing down breaks a resting stone supported by a wall or another stone',()=>{
 for(const support of ['wall','stone']){
  const g=new Game({walls:support==='wall'?[[5,5]]:[],objects:[{type:3,x:5,y:3},...(support==='stone'?[{type:3,x:5,y:5}]:[])]});
  const stone=g.rocks[0];g.player.x=5;g.player.y=1;
  assert.equal(g.move(0,1),false);
  assert.ok(!g.rocks.includes(stone),support);
  assert.equal(g.event,'break');
  assert.deepEqual({x:g.player.x,y:g.player.y},{x:5,y:1});
 }
});

test('Pressure from above preserves objective eggs, unsupported stones and falling stones',()=>{
 for(const scenario of ['egg','unsupported','falling']){
  const g=new Game({walls:scenario==='unsupported'?[]:[[5,5]],objects:[{type:scenario==='egg'?2:3,x:5,y:3}]});
  const stone=g.rocks[0];stone.falling=scenario==='falling';
  g.player.x=5;g.player.y=1;
  assert.equal(g.move(0,1),false);
  assert.ok(g.rocks.includes(stone),scenario);
  assert.notEqual(g.event,'break');
 }
});

test('Pressure from below or contact with an upper corner does not break a stone',()=>{
 for(const player of [{x:5,y:5,dy:-1},{x:4,y:1,dy:1}]){
  const g=new Game({walls:[],objects:[{type:3,x:5,y:3},{type:3,x:6,y:5}]});
  // One cell of support leaves room for Flappy in the below-contact case.
  if(player.dy<0)g.rocks[1].x=7;
  g.player.x=player.x;g.player.y=player.y;
  const stone=g.rocks[0];
  assert.equal(g.move(0,player.dy),false);
  assert.ok(g.rocks.includes(stone));
 }
});
test('The objective egg cannot be destroyed against a wall',()=>{
 const g=new Game({walls:[[5,1]],objects:[{type:2,x:3,y:1},{type:6,x:3,y:21}]});assert.equal(g.move(1,0),false);assert.equal(g.rocks.length,1);
});

test('Holding a direction after pushing a stone off a ledge does not delete it',()=>{
 const g=new Game(level([{type:3,x:3,y:1}],[[6,2]]));
 const stone=g.rocks.find(r=>!r.egg);
 assert.equal(g.move(1,0),true);
 g.tick();
 assert.equal(stone.y,2);
 assert.equal(g.move(1,0),false);
 assert.ok(g.rocks.includes(stone));
 assert.equal(stone.x,4);
});

test('Touching the corner of a stone cannot push or break it',()=>{
 for(const walls of [[],[[5,3]]]){
  const g=new Game(level([{type:3,x:3,y:3}],walls));
  g.player.y=2;
  const stone=g.rocks.find(r=>!r.egg);
  assert.equal(g.move(1,0),false);
  assert.ok(g.rocks.includes(stone));
  assert.equal(stone.x,3);
 }
});

test('A falling stone cannot be crushed by a horizontal push',()=>{
 const g=new Game(level([{type:3,x:3,y:3}],[[5,3]]));
 g.player.y=3;
 const stone=g.rocks.find(r=>!r.egg);stone.falling=true;
 assert.equal(g.move(1,0),false);
 assert.ok(g.rocks.includes(stone));
});
test('A falling stone crushes the player',()=>{
 for(const type of [2,3]){
  const g=new Game(level([{type,x:5,y:1}]));g.player.x=5;g.player.y=3;g.tick();
  assert.equal(g.state,'dead');assert.equal(g.reason,'death.falling');assert.equal(g.player.crushed,true);
  assert.equal(g.player.walking,false);assert.equal(g.rocks.find(r=>r.x===5).y,2,'The stone descends above the flattened player');
  const dead=JSON.stringify(g);g.tick();g.move(1,0);g.fire();assert.equal(JSON.stringify(g),dead,'Death freezes the room until a new life enters');
 }
});

test('Both walking into an enemy and an enemy walking into Flappy leave a flattened player',()=>{
 for(const type of [4,5]){
  const g=new Game(level([{type,x:3,y:1}]));g.move(1,0);
  assert.equal(g.state,'dead');assert.equal(g.reason,'death.enemy');assert.equal(g.player.crushed,true);assert.equal(g.player.walking,false);
  const h=new Game(level([{type,x:3,y:1}]));Object.assign(h.enemies[0],{dx:-1,dy:0,pathSteps:1});h.ticks=4;h.random=()=>1;h.tick();
  assert.equal(h.state,'dead');assert.equal(h.player.crushed,true);
 }
});
test('A falling stone or egg leaves a flattened enemy, waits, then continues falling',()=>{
 for(const rockType of [2,3])for(const enemyType of [4,5])for(const sleep of [0,60]){
  const g=new Game({walls:[],objects:[{type:rockType,x:5,y:1},{type:enemyType,x:5,y:3}]});
  g.enemies[0].sleep=sleep;
  const rock=g.rocks[0];g.tick();
  assert.equal(g.enemies.length,0);assert.equal(g.corpses.length,1);
  const corpse=g.corpses[0];
  assert.deepEqual({x:corpse.x,y:corpse.y,w:corpse.w,h:corpse.h},{x:5,y:4,w:2,h:1});
  assert.equal(corpse.crushed,true);assert.equal(corpse.type,enemyType===4?'frog':'ghost');
  assert.equal(rock.y,2);assert.equal(g.event,'crush');
  for(let i=1;i<CRUSH_TICKS;i++){
   g.event=null;g.tick();
   assert.equal(g.corpses.length,1);assert.equal(rock.y,2);
   assert.notEqual(g.event,'crush','The hit must not restart on every tick');
  }
  g.tick();assert.equal(g.corpses.length,0);assert.equal(rock.y,3);assert.equal(rock.falling,true);
 }
});

test('Flattened enemies cannot move, hurt Flappy or be put back to sleep',()=>{
 const g=new Game({walls:[],objects:[{type:3,x:5,y:1},{type:5,x:5,y:3}]});g.tick();
 const corpse=g.corpses[0];
 g.player.x=7;g.player.y=4;
 assert.equal(g.move(-1,0),true);assert.equal(g.state,'playing');
 g.shots.push({x:corpse.x,y:corpse.y,w:1,h:1,dx:1,dy:0,life:3});
 g.tick();
 assert.equal(g.enemies.length,0);assert.equal(corpse.sleep,undefined);
 assert.equal(g.state,'playing');assert.equal(corpse.x,5);assert.equal(corpse.y,4);
});

test('A stack of stones waits above the corpse without recreating it',()=>{
 const g=new Game({walls:[],objects:[{type:3,x:5,y:1},{type:3,x:5,y:3},{type:5,x:5,y:5}]});
 g.tick();const corpse=g.corpses[0];
 assert.equal(g.rocks[1].y,4);
 for(let i=1;i<CRUSH_TICKS;i++){g.tick();assert.equal(g.corpses[0],corpse);assert.equal(g.rocks[1].y,4)}
 g.tick();assert.equal(g.corpses.length,0);assert.equal(g.rocks[1].y,5);
 assert.ok(g.rocks[0].y+2<=g.rocks[1].y);
});
test('Egg resting above the goal completes the scene',()=>{
 const g=new Game({walls:[],objects:[{type:2,x:15,y:19},{type:6,x:15,y:21}]});g.tick();assert.equal(g.state,'won');
});
test('A mushroom is collected once and a shot stuns an enemy',()=>{
 const g=new Game(level([{type:1,x:3,y:1},{type:5,x:5,y:1}]));g.move(1,0);assert.equal(g.ammo,1);g.move(-1,0);g.move(1,0);assert.equal(g.ammo,1);g.fire();for(let i=0;i<3;i++)g.tick();assert.equal(g.ammo,0);assert.ok(g.enemies[0].sleep>0);assert.equal(g.state,'playing');
});

test('Awake and sleeping PMD enemies kill on contact from all four directions',()=>{
 for(const type of [4,5])for(const sleep of [0,60])for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
  const g=new Game({walls:[],objects:[{type,x:10,y:10}]});
  g.enemies[0].sleep=sleep;Object.assign(g.player,{x:10-dx*2,y:10-dy*2});
  g.move(dx,dy);
  assert.equal(g.state,'dead');assert.equal(g.reason,'death.enemy');assert.equal(g.enemies.length,1);
 }
});

test('A mushroom freezes an enemy until its sleep expires without making it passable',()=>{
 for(const type of [4,5]){
  const g=new Game({walls:[],objects:[{type,x:10,y:10}]});
  const enemy=g.enemies[0];enemy.sleep=5;enemy.dx=1;enemy.dy=0;enemy.pathSteps=2;g.player.x=30;g.random=()=>0;
  for(let tick=1;tick<=5;tick++){g.tick();assert.equal(enemy.sleep,5-tick);assert.equal(enemy.x,10);assert.equal(enemy.y,10)}
  for(let tick=0;tick<5;tick++)g.tick();assert.equal(enemy.x,11);
 }
});

test('Side pressure breaks an ordinary stone against an enemy and never deletes the enemy',()=>{
 for(const type of [4,5])for(const sleep of [0,60])for(const dx of [-1,1]){
  const g=new Game({walls:[],objects:[{type:3,x:10,y:10},{type,x:10+dx*2,y:10}]});
  const enemy=g.enemies[0];enemy.sleep=sleep;Object.assign(g.player,{x:10-dx*2,y:10});
  assert.equal(g.move(dx,0),false);assert.equal(g.rocks.length,0);assert.equal(g.enemies[0],enemy);
  assert.equal(enemy.x,10+dx*2);assert.equal(enemy.sleep,sleep);assert.equal(g.corpses.length,0);
  assert.equal(g.debris.length,1);assert.equal(g.event,'break');assert.equal(g.state,'playing');
  assert.equal(g.player.x,10-dx*2);
 }
});

test('A crystal is blocked by both awake and sleeping enemies without breaking or killing',()=>{
 for(const type of [4,5])for(const sleep of [0,60])for(const dx of [-1,1]){
  const g=new Game({walls:[],objects:[{type:2,x:10,y:10},{type,x:10+dx*2,y:10}]});
  g.enemies[0].sleep=sleep;Object.assign(g.player,{x:10-dx*2,y:10});
  assert.equal(g.move(dx,0),false);assert.equal(g.rocks.length,1);assert.equal(g.rocks[0].x,10);
  assert.equal(g.enemies.length,1);assert.equal(g.corpses.length,0);assert.equal(g.debris.length,0);
  assert.equal(g.player.x,10-dx*2);assert.equal(g.state,'playing');
 }
});
test('All scenes remain inside the board during simulation',()=>{
 for(const l of levels){const g=new Game(l);for(let i=0;i<100&&g.state==='playing';i++)g.tick();for(const r of g.rocks)assert.ok(r.x>=0&&r.x+2<=40&&r.y>=0&&r.y+2<=22)}
});
