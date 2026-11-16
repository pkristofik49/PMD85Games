import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GRAPHICS_KEY,graphicsModes,loadGraphics,modernPlayerFrame,modernEnemyFrame} from '../src/graphics.js';

test('Graphics preferences accept known modes and recover from unavailable or invalid storage',()=>{
 for(const mode of graphicsModes)assert.equal(loadGraphics({getItem(key){assert.equal(key,GRAPHICS_KEY);return mode}}),mode);
 for(const value of [null,'','invalid','MODERN'])assert.equal(loadGraphics({getItem:()=>value}),'mono');
 assert.equal(loadGraphics({getItem(){throw Error('Blocked storage')}}),'mono');
});
test('Modern walking frames preserve all four directions and stop at the idle pose',()=>{
 const poses=[[-1,0,[0,1]],[1,0,[2,3]],[0,1,[4,5]],[0,-1,[6,7]]];
 for(const [dx,dy,expected]of poses){
  assert.equal(modernPlayerFrame({dx,dy,walking:false,walkFrame:3}),expected[0]);
  if(dx){
   const frames=[1,2,3,0].flatMap(walkFrame=>[0,.5].map(progress=>modernPlayerFrame({dx,dy,walking:true,walkFrame},progress)));
   assert.deepEqual(frames,Array.from({length:8},(_,i)=>(dx<0?16:24)+i));
   assert.equal(modernPlayerFrame({dx,dy,walking:true,walkFrame:1},1),modernPlayerFrame({dx,dy,walking:true,walkFrame:2},0));
  }else assert.deepEqual([0,1,2,3].map(walkFrame=>modernPlayerFrame({dx,dy,walking:true,walkFrame})),[...expected,...expected]);
 }
});
test('Frogs retain four distinct modern views, including when crushed',()=>{
 for(const [dx,dy,index]of [[-1,0,8],[1,0,9],[0,1,10],[0,-1,11]]){
  assert.equal(modernEnemyFrame({type:'frog',dx,dy}),index);
  assert.equal(modernEnemyFrame({type:'frog',dx,dy,crushed:true}),index);
 }
 assert.equal(modernEnemyFrame({type:'ghost',dx:1}),12);
});
test('The modern atlas is a standalone high-resolution PNG with alpha',()=>{
 const png=fs.readFileSync(new URL('../assets/modern-sprites.png',import.meta.url));
 assert.equal(png.subarray(1,4).toString(),'PNG');
 assert.ok(png.readUInt32BE(16)>=1024&&png.readUInt32BE(20)>=1024);
 assert.equal(png[25],6,'RGBA preserves generated transparency');
});
