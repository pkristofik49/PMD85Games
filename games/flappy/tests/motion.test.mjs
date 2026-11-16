import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Motion} from '../src/motion.js';
import {Game} from '../src/engine.js';
function fixture(){
 const game=new Game({walls:[],objects:[{type:2,x:12,y:1},{type:3,x:9,y:1},{type:4,x:15,y:5},{type:5,x:20,y:5}]});
 game.ammo=1;game.fire();game.ticks=4;game.random=()=>1;
 return game;
}
test('All moving object types interpolate between cells without changing game state',()=>{
 const game=fixture(),motion=new Motion();motion.reset(game);
 game.move(1,0);game.tick();motion.capture(game);
 const objects=[game.player,...game.rocks,...game.enemies,...game.shots],state=JSON.stringify(game);
 motion.advance(60);
 for(const entity of objects){const p=motion.position(entity);assert.equal(p.moving,true);assert.ok(!Number.isInteger(p.x)||!Number.isInteger(p.y));}
 motion.advance(120);
 for(const entity of objects){const p=motion.position(entity);assert.equal(p.moving,false);assert.equal(p.x,entity.x);assert.equal(p.y,entity.y)}
 assert.equal(JSON.stringify(game),state);
});
test('Rapid input continues smoothly from the current visual position',()=>{
 const game=fixture(),motion=new Motion();motion.reset(game);
 game.move(1,0);motion.capture(game);motion.advance(60);
 const midpoint=motion.position(game.player);assert.equal(midpoint.x,1.5);
 game.move(1,0);motion.capture(game);assert.equal(motion.position(game.player).x,midpoint.x);
 motion.advance(60);assert.equal(motion.position(game.player).x,2.25);
});
test('Interpolation is frame-rate independent and freezes without advancing its clock',()=>{
 const game=fixture(),a=new Motion(),b=new Motion();a.reset(game);b.reset(game);
 game.move(1,0);a.capture(game);b.capture(game);a.advance(60);for(let i=0;i<4;i++)b.advance(15);
 assert.deepEqual(a.position(game.player),b.position(game.player));
 const frozen=a.position(game.player);for(let i=0;i<10;i++)assert.deepEqual(a.position(game.player),frozen);
});
test('Death snaps to the collision position and a restarted room resets interpolation',()=>{
 const game=fixture(),motion=new Motion();motion.reset(game);
 game.move(1,0);motion.capture(game);motion.advance(30);game.die('death.enemy');motion.capture(game);
 assert.equal(motion.position(game.player).x,game.player.x);assert.equal(motion.position(game.player).moving,false);
 const next=fixture();motion.reset(next);assert.equal(motion.time,0);assert.equal(motion.position(next.player).x,1);
});
