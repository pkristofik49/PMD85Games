// Extract only data, never executable code, from FLAPPY2k's public PMD tape.
import fs from 'node:fs';
import crypto from 'node:crypto';
const tape=fs.readFileSync(process.argv[2]);
const m=tape.subarray(2455,2455+0x7d76);
if(m[0]!==0xf3||m[1]!==0xc3)throw Error('Unexpected tape format');
const levels=[];
for(let n=1;n<=200;n++){
 let p=m.readUInt16LE(0x4c00+n*2);
 const walls=[];
 for(let bit=0;bit<190;bit++)if(m[p+(bit>>3)]&(128>>(bit%8)))walls.push([1+2*(bit%19),1+2*Math.floor(bit/19)]);
 p+=24;const objects=[];
 for(let i=0;i<250;i++){
  const a=m[p++],x=m[p++];const type=a>>5,y=a&31;
  if(type>6||x>39||y>21)throw Error(`Invalid object in level ${n}`);
  objects.push({type,x,y});if(type===6)break;
 }
 if(objects.at(-1).type!==6)throw Error('Missing goal');
 levels.push({walls,objects});
}
const offsets={rock:0x2389,egg:0x2368,front:0x24a0,walk1:0x24c1,walk2:0x24e2,left:0x2534,right:0x244e,back:0x23fc,ghost:0x26cc,frog:0x27f7,frogUp:0x2849,frogLeft:0x289b,frogRight:0x28ed};
const sprites={};for(const [name,offset]of Object.entries(offsets))sprites[name]=[...m.subarray(offset,offset+32)];
for(const [name,offset]of Object.entries({rockBreak1:0x2607,rockBreak2:0x2628}))sprites[name]=[...m.subarray(offset,offset+32)];
// Native extended poses use 12 x 24 (vertical) or 18 x 16 (horizontal) pixels.
for(const [name,offset]of Object.entries({leftStep:0x2503,rightStep:0x241d,frogDownStep:0x27c6,frogUpStep:0x2818,frogLeftStep:0x286a,frogRightStep:0x28bc}))sprites[name]=[...m.subarray(offset,offset+48)];
// Flattened enemies occupy only the bottom PMD cell (12 x 8 pixels).
for(const [name,offset]of Object.entries({playerCrushed:0x25db,ghostCrushed:0x2731,frogCrushed:0x2952}))sprites[name]=[...m.subarray(offset,offset+16)];
// Native 6-pixel PMD character cells, two bytes per scanline.
sprites.brick=[...m.subarray(0x234f,0x2357)];
fs.mkdirSync('assets',{recursive:true});
fs.writeFileSync('assets/game-data.js',`// Bitmap and scene data: FLAPPY2k, see SOURCES.md.\nexport const levels = ${JSON.stringify(levels)};\nexport const sprites = ${JSON.stringify(sprites)};\n`);
console.log(`Extracted ${levels.length} scenes; tape SHA256 ${crypto.createHash('sha256').update(tape).digest('hex')}`);
