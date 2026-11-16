import test from 'node:test';
import assert from 'node:assert/strict';
import '../assets/pampuch-data.js';
import '../js/pampuch.js';
const {Pampuch,PampuchData}=globalThis;
test('Eleven native maps have the original first level and valid spawn corridors',()=>{
 assert.equal(PampuchData.levels.length,11);assert.equal(PampuchData.levels[0].target,220);
 for(const map of PampuchData.levels){assert.equal(map.rows.length,18);for(const row of map.rows)assert.equal(row.length,24);for(const [x,y]of [[11,16],[1,1],[22,1],[1,16],[22,16]])assert.equal(map.rows[y][x],'.');}
});
test('All native targets can be met without collecting enclosed decorative rings',()=>{
 for(const map of PampuchData.levels){const seen=new Set(),queue=[[11,16]];while(queue.length){const [x,y]=queue.pop(),key=`${x},${y}`;if(seen.has(key)||map.rows[y]?.[x]!=='.')continue;seen.add(key);queue.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}assert.ok(seen.size-1>=map.target);}
});
test('Five lives, frozen ready state, half-cell steps and ring scoring',()=>{
 const game=new Pampuch();assert.equal(game.lives,5);assert.equal(game.time,500);game.tick();assert.equal(game.ticks,0);game.start();
 game.ghosts=[];const before=game.remaining;game.tick();assert.equal(game.player.x,23);assert.equal(game.score,1);assert.equal(game.time,503);assert.equal(game.remaining,before-1);
});
test('An early turn stops against a wall; a blocked direction does not slide',()=>{
 const game=new Pampuch();game.player={x:2,y:2,direction:'left'};assert.equal(game.move(game.player,'left'),false);assert.equal(game.player.x,2);
 game.player={x:3,y:2,direction:'down'};assert.equal(game.move(game.player,'down'),false);
});
test('Deaths leave impassable half-cell tombstones, preserve rings and reset ghosts',()=>{
 const game=new Pampuch();game.start();game.player={x:22,y:32,direction:'right'};const ringCount=game.rings.size;game.die();assert.equal(game.lives,4);assert.equal(game.tombs.length,1);assert.equal(game.state,'dead');
 assert.equal(game.canMove({x:20,y:32},'right'),false);game.continue();assert.equal(game.state,'playing');assert.equal(game.rings.size,ringCount);assert.equal(game.ghosts[0].x,2);
});
test('Ghosts are lethal; swapping positions cannot bypass a collision',()=>{
 const game=new Pampuch();game.start();game.ghosts=[{x:23,y:32,direction:'left'}];game.tick();assert.equal(game.state,'dead');assert.equal(game.lives,4);
});
test('Ghosts keep their direction in a corridor and chase only after a blockage',()=>{
 const game=new Pampuch(),ghost={x:4,y:2,direction:'right'};game.ghostMove(ghost);assert.equal(ghost.x,5);assert.equal(ghost.direction,'right');
});
test('The time limit ends the game, while a pause freezes the clock',()=>{
 const game=new Pampuch();game.state='paused';game.tick();assert.equal(game.time,500);game.start();game.state='playing';game.time=0;game.tick();assert.equal(game.state,'over');assert.equal(game.lives,0);assert.equal(game.time,0);
});
test('Completion uses the native target and maps repeat after eleven levels',()=>{
 const game=new Pampuch();game.start();game.ghosts=[];game.remaining=1;game.tick();assert.equal(game.state,'level');game.continue();assert.equal(game.level,2);assert.equal(game.tombs.length,0);game.level=11;game.state='level';game.continue();assert.equal(game.level,12);assert.deepEqual(game.map,PampuchData.levels[0]);
});
test('Saved games restore paused; corrupt or incompatible data is rejected',()=>{
 const game=new Pampuch();game.start();const saved=JSON.parse(JSON.stringify(game.snapshot()));const restored=Pampuch.restore(saved);assert.equal(restored.state,'paused');assert.deepEqual(restored.player,game.player);assert.equal(restored.rings.size,game.rings.size);
 for(const mutate of [s=>s.version=2,s=>s.player.x=-10,s=>s.ghosts=[],s=>s.rings=['99,99'],s=>s.time=NaN]){const broken=JSON.parse(JSON.stringify(saved));mutate(broken);assert.equal(Pampuch.restore(broken),null);}
 assert.equal(Pampuch.restore(null),null);
});
test('Original sprites are twelve by twelve monochrome pixels',()=>{
 for(const rows of Object.values(PampuchData.sprites)){assert.equal(rows.length,12);for(const row of rows)assert.match(row,/^[01]{12}$/);}
 assert.ok(PampuchData.sprites.playerLeft.some(row=>row.includes('1')));
});
test('Bonus lives follow completed native maps four and eight, including later cycles',()=>{
 for(const [completed,bonus]of [[3,0],[4,1],[8,1],[11,0],[15,1],[19,1]]){
  const game=new Pampuch();game.level=completed;game.state='level';game.continue();assert.equal(game.lives,5+bonus);
 }
});
