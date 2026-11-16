// Differential check: translated policy against the original 8080 instructions.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Game} from '../src/engine.js';
import {decideEnemy,enemyField} from '../src/enemy-ai.js';
import {originalProgram,nativeEnemyDecision} from './pmd-enemy-reference.mjs';
const program=originalProgram(process.argv[2]),fixtures=[];let seed=49851,count=0;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed};
const pick=n=>(random()>>>16)%n;
for(let i=0;i<12000;i++){
 const frog=i%2===0,g=new Game({walls:[],objects:[{type:frog?4:5,x:15,y:10}]}),e=g.enemies[0];
 Object.assign(g.player,{x:2+pick(33),y:2+pick(17)});
 const [dx,dy]=[[1,0],[-1,0],[0,1],[0,-1]][pick(frog?4:2)];Object.assign(e,{dx,dy,pathSteps:pick(8)});
 g.enemyAI.turn=[0,4,14,224,175][pick(5)];
 for(let n=0;n<8;n++){
  const x=11+pick(10),y=7+pick(7);
  if((x>=e.x&&x<e.x+2&&y>=e.y&&y<e.y+2)||(x>=g.player.x&&x<g.player.x+2&&y>=g.player.y&&y<g.player.y+2))continue;
  switch(pick(4)){case 0:g.walls.add(`${x},${y}`);break;case 1:g.rocks.push({x,y,w:2,h:2,egg:false});break;case 2:g.mushrooms.push({x,y,w:1,h:1});break;case 3:g.enemies.push({x,y,w:2,h:2,type:'ghost',dx:1,dy:0,sleep:pick(2)?20:0,pathSteps:pick(8)});break}
 }
 const field=enemyField(g,e),bytes=Array.from({length:12},()=>random()>>>24);
 let a=0,b=0;const copy={...e},shared={...g.enemyAI};
 const expected=nativeEnemyDecision(program,e,g.player,field,()=>bytes[a++],g.enemyAI);
 const decision=decideEnemy(copy,g.player,field,()=>bytes[b++],shared);
 const actual={decision,pathSteps:copy.pathSteps,turn:shared.turn};
 try{assert.deepEqual(actual,expected);assert.equal(b,a,'Same random-byte consumption')}
 catch(error){console.error(JSON.stringify({case:i,enemy:e,player:g.player,shared:g.enemyAI,bytes,actual,expected},null,2));throw error}
 if(i<256)fixtures.push({enemy:e,player:{x:g.player.x,y:g.player.y},turn:g.enemyAI.turn,bytes,expected,walls:[...g.walls].map(s=>s.split(',').map(Number)).filter(([x,y])=>x>0&&x<39&&y>0&&y<21),rocks:g.rocks,mushrooms:g.mushrooms,others:g.enemies.slice(1)});
 count++;
}
console.log(`${count} original PMD enemy decisions match: movement, facing, path counter, shared turn state, collisions and random-byte consumption.`);
if(process.argv.includes('--write-fixtures')){fs.mkdirSync('tests/fixtures',{recursive:true});fs.writeFileSync('tests/fixtures/pmd-enemy-decisions.json',JSON.stringify(fixtures)+'\n');console.log('Saved 256 original-code expectations for CI.');}
