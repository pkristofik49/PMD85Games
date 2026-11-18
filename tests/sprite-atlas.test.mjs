import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readPng} from '../games/flappy/tools/read-png.mjs';
import '../assets/pampuch-native.js';

test('Exported atlas pixels match the original game program bytes, including empty sprite',()=>{
 const metadata=JSON.parse(fs.readFileSync(new URL('../assets/pampuch-sprites.json',import.meta.url)));
 const atlas=readPng(fs.readFileSync(new URL('../assets/pampuch-sprites.png',import.meta.url)));
 assert.equal(atlas.width,64);assert.equal(atlas.height,64);assert.equal(Object.keys(metadata.frames).length,13);
 const occupied=new Set();
 for(const {frame,sourceAddress}of Object.values(metadata.frames)){
  assert.equal(frame.w,12);assert.equal(frame.h,12);const address=parseInt(sourceAddress,16)-0x100;
  for(let y=0;y<12;y++)for(let x=0;x<12;x++){
   const byte=PampuchNativeData.program[address+y*2+Math.floor(x/6)],expected=byte&(1<<(x%6))?0xeeeede:0;
   const pixel=(frame.y+y)*64+frame.x+x;assert.equal(atlas.pixels[pixel],expected,`${sourceAddress} pixel ${x},${y}`);occupied.add(pixel);
  }
 }
 for(let i=0;i<atlas.pixels.length;i++)if(!occupied.has(i))assert.equal(atlas.pixels[i],0,'Atlas spacing stays transparent');
});
