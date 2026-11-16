import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game,BREAK_TICKS} from '../src/engine.js';
import {Motion} from '../src/motion.js';
const cases=[
 {x:3,y:1,walls:[[5,1]],player:{x:1,y:1},direction:[1,0]},
 {x:3,y:1,walls:[[1,1]],player:{x:5,y:1},direction:[-1,0]},
 {x:3,y:3,walls:[[3,5]],player:{x:3,y:1},direction:[0,1]}
];
test('Breaking from either side or above creates one short-lived debris effect',()=>{
 for(const c of cases){
  const game=new Game({walls:c.walls,objects:[{type:3,x:c.x,y:c.y}]});Object.assign(game.player,c.player);
  game.move(...c.direction);assert.equal(game.rocks.length,0);assert.equal(game.debris.length,1);assert.equal(game.event,'break');
  const effect=game.debris[0];assert.deepEqual(effect,{x:c.x,y:c.y,age:0,life:BREAK_TICKS});
  for(let i=1;i<BREAK_TICKS;i++){game.tick();assert.equal(game.debris[0],effect);assert.equal(effect.age,i)}
  game.tick();assert.equal(game.debris.length,0);assert.equal(game.state,'playing');
 }
});
test('The target stone never breaks or produces debris',()=>{
 for(const c of cases){const game=new Game({walls:c.walls,objects:[{type:2,x:c.x,y:c.y}]});Object.assign(game.player,c.player);game.move(...c.direction);assert.equal(game.rocks.length,1);assert.equal(game.debris.length,0)}
});
test('Debris is harmless and does not prevent walking into the former stone position',()=>{
 const game=new Game({walls:[[5,1]],objects:[{type:3,x:3,y:1}]});game.move(1,0);assert.equal(game.move(1,0),true);assert.equal(game.player.x,2);assert.equal(game.state,'playing');assert.equal(game.debris.length,1);
});
test('PC fragments use the presentation clock and freeze when that clock is paused',()=>{
 const game=new Game({walls:[[5,1]],objects:[{type:3,x:3,y:1}]}),motion=new Motion();motion.reset(game);
 game.move(1,0);motion.capture(game);const effect=game.debris[0];
 assert.equal(motion.effectAge(effect),0);motion.advance(60);assert.equal(motion.effectAge(effect),.5);
 for(let i=0;i<10;i++)assert.equal(motion.effectAge(effect),.5);
 motion.reset(game);assert.equal(motion.effectAge(effect),0);
});
