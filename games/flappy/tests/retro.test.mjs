import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {retroModes,retroSet,retroPlayer,retroEnemy} from '../src/retro.js';
import {graphicsModes,titleScreens} from '../src/graphics.js';
test('All six display choices restore valid preferences and provide historical title assets',()=>{
 assert.deepEqual(graphicsModes,['mono','color','sharp','msx','nes','modern']);
 for(const mode of retroModes){const title=titleScreens[mode],png=fs.readFileSync(new URL('../'+title.src,import.meta.url));assert.equal(png.readUInt32BE(16),title.width);assert.equal(png.readUInt32BE(20),title.height)}
});
test('Platform bitmaps retain their source dimensions and RGB pixels',()=>{
 for(const mode of retroModes)for(const [name,frame]of Object.entries(retroSet(mode))){assert.equal(frame.pixels.length,frame.width*frame.height,mode+': '+name);assert.ok(frame.pixels.every(pixel=>Number.isInteger(pixel)&&pixel>=0&&pixel<=0xffffff));assert.ok(frame.pixels.some(Boolean))}
 assert.ok(retroSet('nes').BLUE_BALL.pixels.includes(0x0000a8),'Dark NES blue must remain opaque');
 for(const name of ['RED_BALL','BLUE_BALL']){
  const columns=retroSet('msx')[name].pixels.flatMap((pixel,i)=>pixel?[i%16]:[]);
  assert.equal(Math.min(...columns),0);assert.equal(Math.max(...columns),15,'MSX stones must span the full original 16px width');
 }
});
test('Every platform renders directional player and enemy animation, crushing and crumbling',()=>{
 for(const mode of retroModes){const set=retroSet(mode);
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])for(const walkFrame of [0,1]){
   assert.ok(retroPlayer(set,{dx,dy,walking:true,walkFrame}));
   for(const type of ['frog','ghost'])for(const stepTick of [0,undefined])assert.ok(retroEnemy(set,{dx,dy,type,stepTick},0));
  }
  assert.equal(retroPlayer(set,{crushed:true}).height,8);
  for(const type of ['frog','ghost'])assert.equal(retroEnemy(set,{type,crushed:true},0).height,8);
  assert.notDeepEqual(set.BALL_CRASH_1.pixels,set.BALL_CRASH_2.pixels);
 }
 assert.equal(retroSet('nes').RED_DOWN_1.height,16,'The NES down pose excludes wall rows from the screenshot');
});
