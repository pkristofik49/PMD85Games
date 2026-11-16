// A reviewable PNG of the exact poses rendered by the game. No image libraries.
import fs from 'node:fs';
import zlib from 'node:zlib';
import {bitmap,playerPose,enemySprite} from '../src/render.js';
import {sprites} from '../assets/game-data.js';
const scale=4,cellWidth=26,cellHeight=32,width=cellWidth*4*scale,height=cellHeight*12*scale;
const pixels=Buffer.alloc(width*height*4);
for(let i=0;i<pixels.length;i+=4)pixels.set([8,11,8,255],i);
const ctx={fillStyle:'#eef0e5',fillRect(x,y,w,h){
 const color=this.fillStyle==='#eef0e5'?[238,240,229,255]:[54,60,49,255];
 for(let py=y*scale;py<(y+h)*scale;py++)for(let px=x*scale;px<(x+w)*scale;px++){
  if(px>=0&&px<width&&py>=0&&py<height)pixels.set(color,(py*width+px)*4);
 }
}};
const directions=[[-1,0],[1,0],[0,-1],[0,1]];
function draw(pose,col,row){bitmap(ctx,pose.data,col*cellWidth+8+pose.x,row*cellHeight+8+pose.y,pose.width,pose.height,'#eef0e5',pose.flip)}
for(let row=0;row<4;row++)for(let frame=0;frame<4;frame++)draw(playerPose({dx:directions[row][0],dy:directions[row][1],walking:true,walkFrame:frame}),frame,row);
for(let row=0;row<4;row++)for(let frame=0;frame<2;frame++)draw(enemySprite({type:'frog',dx:directions[row][0],dy:directions[row][1],sleep:0,stepTick:frame?0:undefined},0),frame,row+4);
for(let i=0;i<2;i++)draw(enemySprite({type:'ghost',dx:i?1:-1,dy:0,sleep:0},0),i,8);
for(const [col,type]of ['ghost','frog'].entries())draw(enemySprite({type,crushed:true},0),col,9);
draw(playerPose({crushed:true}),0,10);
for(const [col,data]of [sprites.rockBreak1,sprites.rockBreak2].entries())draw({data,width:2,height:16,x:0,y:0},col,11);
ctx.fillStyle='#363c31';
for(let row=1;row<12;row++)ctx.fillRect(0,row*cellHeight,width/scale,1);
const raw=Buffer.alloc((width*4+1)*height);
for(let y=0;y<height;y++)pixels.copy(raw,y*(width*4+1)+1,y*width*4,(y+1)*width*4);
function chunk(name,data){
 const tag=Buffer.from(name),size=Buffer.alloc(4),sum=Buffer.alloc(4);size.writeUInt32BE(data.length);
 let crc=0xffffffff;for(const byte of Buffer.concat([tag,data])){crc^=byte;for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}
 sum.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([size,tag,data,sum]);
}
const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
fs.writeFileSync(new URL('../assets/sprites.png',import.meta.url),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
console.log('Sprite preview: assets/sprites.png');
