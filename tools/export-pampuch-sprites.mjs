// Lossless native sprite export using only Node's built-in modules.
import fs from 'node:fs';
import {deflateSync} from 'node:zlib';
import '../assets/pampuch-data.js';
import '../js/pixel-font.js';

const entries=[
 ['playerLeft','LEFT - OPEN',0x0ce0],['playerRight','RIGHT - OPEN',0x0cf8],
 ['playerUp','UP - OPEN',0x0d10],['playerDown','DOWN - OPEN',0x0d28],
 ['playerLeftClosed','LEFT - CLOSED',0x0d40],['playerRightClosed','RIGHT - CLOSED',0x0d58],
 ['playerUpClosed','UP - CLOSED',0x0d70],['playerDownClosed','DOWN - CLOSED',0x0d88],
 ['ghost','GHOST',0x0cc8],['tomb','TOMBSTONE',0x0c98],
 ['wall','WALL',0x0ffd],['ring','RING',0x1015],['blank','CLEAR - EMPTY',0x0c80]
];
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let bit=0;bit<8;bit++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function chunk(type,body){
 const name=Buffer.from(type),content=Buffer.concat([name,body]);let crc=0xffffffff;
 for(const byte of content)crc=crcTable[(crc^byte)&255]^(crc>>>8);
 const length=Buffer.alloc(4),checksum=Buffer.alloc(4);length.writeUInt32BE(body.length);checksum.writeUInt32BE((crc^0xffffffff)>>>0);
 return Buffer.concat([length,content,checksum]);
}
function png(image){
 const {width,height,pixels}=image,header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
 const raw=Buffer.alloc(height*(width*4+1));
 for(let y=0;y<height;y++)pixels.copy(raw,y*(width*4+1)+1,y*width*4,(y+1)*width*4);
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
const image=(width,height)=>({width,height,pixels:Buffer.alloc(width*height*4)});
const color=hex=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16),255];
function rect(image,x,y,width,height,rgba){for(let dy=Math.max(0,y);dy<Math.min(image.height,y+height);dy++)for(let dx=Math.max(0,x);dx<Math.min(image.width,x+width);dx++)image.pixels.set(rgba,(dy*image.width+dx)*4);}
function sprite(image,name,x,y,scale=1){
 PampuchData.sprites[name].forEach((row,dy)=>[...row].forEach((pixel,dx)=>{if(pixel==='1')rect(image,x+dx*scale,y+dy*scale,scale,scale,color('#eeeede'));}));
}
function text(image,label,x,y,scale=1,ink='#eeeede'){
 const ctx={fillStyle:ink,fillRect(dx,dy,w,h){rect(image,x+dx*scale,y+dy*scale,w*scale,h*scale,color(this.fillStyle));}};
 pixelText(ctx,label,0,0,ink);
}

const atlas=image(64,64),frames={};
entries.forEach(([name,label,address],i)=>{
 const x=(i%4)*16+2,y=Math.floor(i/4)*16+2;sprite(atlas,name,x,y);
 frames[name]={frame:{x,y,w:12,h:12},sourceAddress:'0x'+address.toString(16).toUpperCase().padStart(4,'0'),label};
});
const metadata={meta:{image:'pampuch-sprites.png',size:{w:64,h:64},format:'RGBA8888',scale:'1',cellSize:16,padding:2,description:'Original PMD 85 Pampuch sprites; 12 x 12 native pixels; transparent background. Blank is the original empty erasing bitmap.'},frames};

const preview=image(768,704);rect(preview,0,0,768,704,color('#111d16'));
text(preview,'PAMPUCH - NATIVE SPRITES',20,18,3);
text(preview,'13 SPRITES - 12X12 PIXELS - 6X PREVIEW',20,48,1,'#a6bc90');
entries.forEach(([name,label,address],i)=>{
 const x=16+(i%4)*184,y=76+Math.floor(i/4)*150;
 rect(preview,x,y,176,140,color('#1a2b20'));
 for(let dy=0;dy<12;dy++)for(let dx=0;dx<12;dx++)rect(preview,x+52+dx*6,y+12+dy*6,6,6,color((dx+dy)%2?'#233b2b':'#294332'));
 sprite(preview,name,x+52,y+12,6);
 text(preview,label,x+12,y+99,1);
 text(preview,'0X'+address.toString(16).toUpperCase(),x+12,y+116,1,'#a6bc90');
});
text(preview,'ORIGINAL PIXELS - PREVIEW ONLY - GAME USES NATIVE PROGRAM DATA',20,684,1,'#a6bc90');
const outputs=[['assets/pampuch-sprites.png',png(atlas)],['assets/pampuch-sprites.json',Buffer.from(JSON.stringify(metadata,null,2)+'\n')],['assets/pampuch-sprites-preview.png',png(preview)]];
for(const [file,data]of outputs){
 if(process.argv.includes('--check')){if(!fs.existsSync(file)||!fs.readFileSync(file).equals(data))throw Error('Sprite export is stale: '+file);}
 else fs.writeFileSync(file,data);
}
console.log('Exported 13 original sprites: 64 x 64 transparent atlas, JSON frames and labelled 6x preview.');
