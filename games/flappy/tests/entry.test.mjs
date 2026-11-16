import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game,ENTRY_TICKS} from '../src/engine.js';
import {levels} from '../assets/game-data.js';
import {HUD_HEIGHT,CANVAS_HEIGHT,CANVAS_WIDTH} from '../src/render.js';
import {pixelText} from '../src/pixel-font.js';
import {translate} from '../src/i18n.js';

test('Entry descends from the life queue through a temporary gate and closes it behind Flappy',()=>{
 const game=new Game(levels[0],{entering:true});
 assert.equal(game.state,'entering');assert.equal(game.player.y,-2);
 assert.ok(!game.walls.has('1,0')&&!game.walls.has('2,0'));
 const positions=[];
 for(let i=1;i<=ENTRY_TICKS;i++){
  game.tick();positions.push(game.player.y);
  if(i<=5)assert.ok(!game.walls.has('1,0')&&!game.walls.has('2,0'));
  if(i>=6)assert.ok(game.walls.has('1,0')&&game.walls.has('2,0'));
 }
 assert.deepEqual(positions.slice(0,5),[-2,-2,-1,0,1]);
 assert.equal(game.state,'playing');assert.equal(game.entry,null);
 assert.deepEqual({x:game.player.x,y:game.player.y},{x:1,y:1});
 assert.equal(game.wallAt(game.player),false);
 assert.equal(game.player.walking,false);
});
test('All 200 scenes stay unchanged and their clock stays stopped during entry',()=>{
 for(const level of levels){
  const original=new Game(level),game=new Game(level,{entering:true});
  const objects=JSON.stringify({rocks:game.rocks,enemies:game.enemies,mushrooms:game.mushrooms});
  for(let i=0;i<ENTRY_TICKS;i++)game.tick();
  assert.equal(game.ticks,0);
  assert.equal(JSON.stringify({rocks:game.rocks,enemies:game.enemies,mushrooms:game.mushrooms}),objects);
  assert.deepEqual([...game.walls].sort(),[...original.walls].sort());
 }
});
test('Movement, firing and hazards cannot interrupt the life entry sequence',()=>{
 const game=new Game({walls:[],objects:[{type:3,x:1,y:3},{type:5,x:1,y:1}]},{entering:true});
 game.ammo=1;
 for(let i=0;i<ENTRY_TICKS-1;i++){
  assert.equal(game.move(1,0),false);assert.equal(game.fire(),false);game.tick();
  assert.equal(game.state,'entering');assert.equal(game.ammo,1);
 }
 game.tick();assert.equal(game.state,'playing');assert.equal(game.shots.length,0);
});
test('The integrated status strip uses integer pixel glyphs in both languages',()=>{
 assert.equal(CANVAS_WIDTH,240);assert.equal(CANVAS_HEIGHT,176+HUD_HEIGHT);
 const pixels=[];const ctx={fillRect(...rect){pixels.push(rect)}};
 for(const language of ['cs','en']){
  pixelText(ctx,translate(language,'game.scene'),78,8);
  pixelText(ctx,translate(language,'game.time'),174,8);
  pixelText(ctx,'200',138,8);pixelText(ctx,'6:00',210,8);
 }
 assert.ok(pixels.length>100);
 assert.ok(pixels.every(([x,y,w,h])=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<CANVAS_WIDTH&&y>=0&&y<HUD_HEIGHT&&w===1&&h===1));
});
