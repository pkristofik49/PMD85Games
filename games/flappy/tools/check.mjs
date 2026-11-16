import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {levels,sprites} from '../assets/game-data.js';
const root=new URL('../',import.meta.url);
for(const file of ['src/enemy-ai.js','assets/pmd-ai-probes.js'])execFileSync(process.execPath,['--check',new URL(file,root).pathname.replace(/^\/([A-Za-z]:)/,'$1')]);
const version=fs.readFileSync(new URL('VERSION',root),'utf8').trim();
assert.match(version,/^\d+\.\d{3}$/);
const context={};vm.runInNewContext(fs.readFileSync(new URL('version.js',root),'utf8'),context);assert.equal(context.FLAPPY_VERSION,version);
assert.equal(levels.length,200);
for(const [n,l]of levels.entries()){
 assert.equal(l.objects.filter(o=>o.type===2).length,1,`Scene ${n+1}: one objective egg`);
 assert.equal(l.objects.filter(o=>o.type===6).length,1,`Scene ${n+1}: one goal`);
 for(const o of l.objects){assert.ok(o.x>=0&&o.x<40);assert.ok(o.y>=0&&o.y<22)}
}
for(const[name,data]of Object.entries(sprites)){assert.ok(data.length>0,name);assert.ok(data.every(v=>v>=0&&v<64),name)}
for(const file of ['sw.js','version.js','src/app.js','src/engine.js','src/render.js','src/retro.js','src/passwords.js','assets/sector-passwords.js','assets/retro-data.js','src/graphics.js','src/motion.js','src/transition.js','src/pixel-font.js','src/audio.js','src/i18n.js','src/translations.js','assets/game-data.js','vendor/vue.esm-browser.prod.js'])execFileSync(process.execPath,['--check',new URL(file,root).pathname.replace(/^\/([A-Za-z]:)/,'$1')]);
execFileSync(process.execPath,[new URL('tools/localize-static.mjs',root).pathname.replace(/^\/([A-Za-z]:)/,'$1'),'--check']);
const manifest=JSON.parse(fs.readFileSync(new URL('manifest.webmanifest',root),'utf8'));
for(const icon of manifest.icons){const data=fs.readFileSync(new URL(icon.src,root));assert.equal(data.readUInt32BE(16),Number(icon.sizes.split('x')[0]));assert.equal(data.readUInt32BE(20),Number(icon.sizes.split('x')[1]))}
const worker=fs.readFileSync(new URL('sw.js',root),'utf8');
for(const match of worker.matchAll(/'\.\/([^']*)'/g)){if(match[1])assert.ok(fs.existsSync(new URL(match[1],root)),`Missing offline asset ${match[1]}`)}
console.log(`Flappy ${version}: 200 scenes, bitmaps, syntax, manifest and offline assets OK`);
