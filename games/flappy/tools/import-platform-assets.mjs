// Import historical bitmap data only. No external game code runs in the app.
import fs from 'node:fs';
import {deflateSync} from 'node:zlib';
import {readPng,crop} from './read-png.mjs';
const root=process.argv[2];if(!root)throw Error('Pass the reference directory');
const read=name=>fs.readFileSync(root+'/'+name,'utf8');
const sharp={};
for(const match of read('sharp-Images.js').matchAll(/(\w+): li\('([^']+)'\)/g)){
 const bytes=Buffer.from(match[2],'base64'),width=(bytes[0]&15)*8,height=(bytes[0]&240)>>1,plane=width/8*height,pixels=[];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const offset=1+y*width/8+Math.floor(x/8),bit=x%8;
  const value=((bytes[offset]>>bit)&1)*2+((bytes[offset+plane]>>bit)&1);
  pixels.push([0,0xff0000,0x0000ff,0xffff00][value]);
 }
 sharp[match[1]]={width,height,pixels};
}
const source=name=>readPng(fs.readFileSync(root+'/'+name+'.png'));
const msxImage=source('msx-game'),nesImage=source('nes-game');
const extract=(image,x,y,w=16,h=16)=>{const frame=crop(image,x,y,w,h);frame.pixels=frame.pixels.map(c=>((c>>16)&255)<=6&&((c>>8)&255)<=6&&(c&255)<=6?0:c);return frame};
const recolor=(frame,map)=>({...frame,pixels:frame.pixels.map(c=>map[c]??c)});
const map={msx:{[0xff0000]:0xf75050,[0x0000ff]:0x20b038,[0xffff00]:0xd0c050},nes:{[0xff0000]:0xd82800,[0x0000ff]:0xa40000,[0xffff00]:0xfce4a0}};
const derive=mode=>Object.fromEntries(Object.entries(sharp).map(([key,frame])=>[key,recolor(frame,map[mode])]));
const msx=derive('msx'),nes=derive('nes');
msx.RED_WALL=extract(msxImage,0,24,8,8);
msx.BLUE_WALL=recolor(msx.RED_WALL,{[0x40e8f0]:0x5050e8});
msx.CHICKEN_RIGHT_1=extract(msxImage,8,32);
msx.CHICKEN_LEFT_1={...msx.CHICKEN_RIGHT_1,pixels:msx.CHICKEN_RIGHT_1.pixels.map((_,i)=>msx.CHICKEN_RIGHT_1.pixels[Math.floor(i/16)*16+15-i%16])};
msx.RED_BALL=extract(msxImage,144,64);msx.BLUE_BALL=extract(msxImage,184,32);
msx.RED_DOWN_1=extract(msxImage,168,96);msx.BLUE_LEFT_1=extract(msxImage,72,64);msx.BLUE_LEFT_2=msx.BLUE_LEFT_1;
msx.BLUE_RIGHT_1={...msx.BLUE_LEFT_1,pixels:msx.BLUE_LEFT_1.pixels.map((_,i)=>msx.BLUE_LEFT_1.pixels[Math.floor(i/16)*16+15-i%16])};msx.BLUE_RIGHT_2=msx.BLUE_RIGHT_1;
msx.MUSHROOM=extract(msxImage,16,168,8,8);
nes.RED_WALL=extract(nesImage,0,41,8,8);nes.BLUE_WALL=extract(nesImage,152,193,8,8);
nes.RED_BALL=extract(nesImage,80,81);nes.BLUE_BALL=extract(nesImage,96,81);
nes.CHICKEN_DOWN_1=extract(nesImage,8,49);
// Keep the clean derived down pose; this screenshot region contains wall and stone pixels.
nes.BLUE_RIGHT_1=extract(nesImage,224,97);nes.BLUE_RIGHT_2=nes.BLUE_RIGHT_1;
nes.BLUE_LEFT_1={...nes.BLUE_RIGHT_1,pixels:nes.BLUE_RIGHT_1.pixels.map((_,i)=>nes.BLUE_RIGHT_1.pixels[Math.floor(i/16)*16+15-i%16])};nes.BLUE_LEFT_2=nes.BLUE_LEFT_1;
// Only game sprites and tiles are exported, retaining source dimensions.
const keep=/^(RED_WALL|BLUE_WALL|RED_BALL|BLUE_BALL|MUSHROOM|CHICKEN_(UP|DOWN|LEFT|RIGHT)_[123]|CHICKEN_CRASH|BLUE_(LEFT|RIGHT)_[12]|BLUE_CRASH|RED_(UP|DOWN|LEFT|RIGHT)_[123]|RED_CRASH|BALL_CRASH_[12])$/;
const select=set=>Object.fromEntries(Object.entries(set).filter(([key])=>keep.test(key)));
fs.writeFileSync('assets/retro-data.js','// Historical bitmap imports and derived directional poses. See SOURCES.md.\nexport const retroData = '+JSON.stringify({sharp:select(sharp),msx:select(msx),nes:select(nes)})+';\n');
// A static frame of the original Sharp introduction, rebuilt from its native data.
const title={width:320,height:200,pixels:Array(320*200).fill(0)};
function put(frame,x,y){for(let row=0;row<frame.height;row++)for(let col=0;col<frame.width;col++){const px=x+col,py=y+row;if(px>=0&&px<320&&py>=0&&py<200)title.pixels[py*320+px]=frame.pixels[row*frame.width+col]}}
const logo=read('sharp-Intro.js').match(/var LOGO=\[([^\]]+)\]/)[1].split(',').map(Number);
for(let y=0;y<logo.length;y++)for(let x=0;x<40;x++)if(Math.floor(logo[y]/2**(39-x))%2)put(sharp.BLUE_WALL,x*8,y*8);
for(const [x,y,w,h,blue]of [[1,13,14,2,false],[17,13,22,2,false],[1,22,38,2,false],[28,22,2,1,true]])for(let row=0;row<h;row++)for(let col=0;col<w;col++)put(sharp[blue?'BLUE_WALL':'RED_WALL'],(x+col)*8,(y+row)*8);
for(const [key,x,y]of [['CHICKEN_DOWN_1',28,11],['RED_DOWN_1',24,16],['BLUE_LEFT_2',11,20],['BLUE_BALL',17,11],['MUSHROOM',22,12]])put(sharp[key],x*8,y*8);
const chars=read('sharp-Font.js').match(/var CHARS=window.atob\(([\s\S]*?)\);/)[1];
const font=Buffer.from([...chars.matchAll(/'([^']*)'/g)].map(m=>m[1]).join(''),'base64');
for(const [i,char]of [...'1984'].entries())for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(font[(char.charCodeAt(0)-32)*8+y]&(128>>x))title.pixels[(144+y)*320+144+i*8+x]=0xffff00;
function chunk(name,data){const tag=Buffer.from(name),size=Buffer.alloc(4),sum=Buffer.alloc(4);size.writeUInt32BE(data.length);let crc=0xffffffff;for(const b of Buffer.concat([tag,data])){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}sum.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([size,tag,data,sum])}
const raw=Buffer.alloc(200*(320*3+1));for(let y=0;y<200;y++)for(let x=0;x<320;x++){const c=title.pixels[y*320+x],p=y*961+1+x*3;raw[p]=c>>16;raw[p+1]=c>>8;raw[p+2]=c}
const header=Buffer.alloc(13);header.writeUInt32BE(320);header.writeUInt32BE(200,4);header[8]=8;header[9]=2;
fs.writeFileSync('assets/title-sharp.png',Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
console.log('Imported Sharp, MSX and NES sprite data and the Sharp introduction.');
