// Reproduce native assets from the original tape; see SOURCES.md.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const source=process.argv[2];if(!source)throw Error('Usage: node tools/import-pampuch.mjs path/to/games-2.ptp [--check]');
const tape=fs.readFileSync(source),blocks=[];
for(let p=0;p<tape.length;){const n=tape.readUInt16LE(p);assert.ok(n>0&&p+n+2<=tape.length);blocks.push(tape.subarray(p+2,p+n+2));p+=n+2;}
const header=blocks.findIndex(b=>b.length===63&&b.subarray(54,62).toString()==='PAMPUCH ');assert.ok(header>=0);
const program=blocks[header+2];assert.equal(createHash('sha256').update(program).digest('hex'),'28371bc736e54701e3301cda6ff021959d0bc58a29ace968bb61c47faa098c6f');
const m=new Uint8Array(65536);m.set(program,0x100);
const levels=Array.from({length:11},(_,i)=>{const p=0xd69+55*(i+1);return{target:m[p],rows:Array.from({length:18},(_,y)=>Array.from({length:24},(_,x)=>m[p+1+y*3+(x>>3)]&(128>>(x&7))?'#':'.').join(''))}});
const bitmap=p=>Array.from({length:12},(_,y)=>Array.from({length:12},(_,x)=>m[p+y*2+Math.floor(x/6)]&(1<<(x%6))?'1':'0').join(''));
const sprites={};for(const [name,p]of Object.entries({blank:0xc80,playerLeft:0xce0,tomb:0xc98,ghost:0xcc8,playerRight:0xcf8,playerUp:0xd10,playerDown:0xd28,playerLeftClosed:0xd40,playerRightClosed:0xd58,playerUpClosed:0xd70,playerDownClosed:0xd88,wall:0xffd,ring:0x1015}))sprites[name]=bitmap(p);
const output='// Extracted from the original PAMPUCH tape. See SOURCES.md.\nglobalThis.PampuchData = '+JSON.stringify({levels,sprites})+';\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync('assets/pampuch-data.js','utf8'),output);else fs.writeFileSync('assets/pampuch-data.js',output);
const monitorPath=process.argv.slice(3).find(arg=>!arg.startsWith('--'));
if(monitorPath){
 const monitor=fs.readFileSync(monitorPath);
 assert.equal(createHash('sha256').update(monitor).digest('hex'),'1fed5851c353d24f99eae88bfdb858ca0e01c9d737be94eb7e761efeeb84a849','Unexpected PMD 85-1 monitor');
 const native='// Original PAMPUCH and PMD 85-1 monitor. Provenance and hashes: SOURCES.md.\nglobalThis.PampuchNativeData = '+JSON.stringify({program:[...program.subarray(0,-1)],monitor:[...monitor]})+';\n';
 if(process.argv.includes('--check'))assert.equal(fs.readFileSync('assets/pampuch-native.js','utf8'),native);
 else fs.writeFileSync('assets/pampuch-native.js',native);
}
console.log('Original hash, eleven maps and thirteen bitmaps verified.');
