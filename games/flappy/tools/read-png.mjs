// Read-only PNG decoder for importing historical bitmap data; no packages.
import {inflateSync} from 'node:zlib';
export function readPng(data){
 const width=data.readUInt32BE(16),height=data.readUInt32BE(20),depth=data[24],type=data[25];
 if(data[28])throw Error('Interlaced PNG is unsupported');
 let palette=[],alpha=[],parts=[];
 for(let p=8;p<data.length;){const size=data.readUInt32BE(p),tag=data.toString('ascii',p+4,p+8),body=data.subarray(p+8,p+8+size);if(tag==='PLTE')palette=[...body];if(tag==='tRNS')alpha=[...body];if(tag==='IDAT')parts.push(body);p+=size+12}
 const channels={0:1,2:3,3:1,4:2,6:4}[type],stride=Math.ceil(width*channels*depth/8),bpp=Math.max(1,Math.ceil(channels*depth/8));
 const raw=inflateSync(Buffer.concat(parts)),rows=[],pixels=[];
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c};
 for(let y=0;y<height;y++){
  const filter=raw[y*(stride+1)],row=Buffer.from(raw.subarray(y*(stride+1)+1,(y+1)*(stride+1))),prev=rows[y-1];
  for(let x=0;x<stride;x++){const a=x>=bpp?row[x-bpp]:0,b=prev?.[x]??0,c=x>=bpp?prev?.[x-bpp]??0:0;row[x]=(row[x]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255}rows.push(row);
  for(let x=0;x<width;x++){
   if(type===3){const bit=x*depth,index=(row[bit>>3]>>(8-depth-(bit%8)))&((1<<depth)-1);pixels.push(alpha[index]===0?0:(palette[index*3]<<16)|(palette[index*3+1]<<8)|palette[index*3+2])}
   else if(type===2||type===6){const p=x*channels;pixels.push(type===6&&row[p+3]===0?0:(row[p]<<16)|(row[p+1]<<8)|row[p+2])}
   else throw Error('Unsupported PNG format');
  }
 }
 return {width,height,pixels};
}
export function crop(image,x,y,width,height){return {width,height,pixels:Array.from({length:width*height},(_,i)=>image.pixels[(y+Math.floor(i/width))*image.width+x+i%width])}}
