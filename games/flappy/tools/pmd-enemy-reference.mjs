// Test-only 8080 runner for the original enemy decision branches. Never shipped
// in the PWA. Rendering is intercepted after a movement decision is complete.
import fs from 'node:fs';
import assert from 'node:assert/strict';
export function originalProgram(path){
 const tape=fs.readFileSync(path),blocks=[];
 for(let p=0;p<tape.length;){const n=tape.readUInt16LE(p);blocks.push(tape.subarray(p+2,p+n+2));p+=n+2}
 const h=blocks.findIndex(b=>b.length===63&&b.subarray(54,62).toString()==='*FLAPPY*');assert.ok(h>=0);
 const program=blocks[h+3].subarray(0x71);assert.deepEqual([...program.subarray(0x1c15,0x1c1a)],[0x3e,3,0x32,4,0x1c]);return program;
}
export function nativeEnemyDecision(program,enemy,player,field,randomByte,shared,trace=()=>{}){
 const m=new Uint8Array(65536);m.set(program);
 const anchor=0xc000+enemy.y*576+enemy.x,playerAddress=0xc000+player.y*576+player.x,ownAttribute=0x9000+enemy.y*64+enemy.x;
 const putWord=(p,v)=>{m[p]=v&255;m[p+1]=v>>8};
 for(let row=0;row<22*9;row++)for(let x=0;x<64;x++)m[0xc000+row*64+x]=field.read(x-enemy.x,row-enemy.y*9);
 for(let y=0;y<22;y++)for(let x=0;x<64;x++)m[0x9000+y*64+x]=field.attribute(x-enemy.x,y*9-enemy.y*9);
 m[ownAttribute]=enemy.pathSteps||0;putWord(0x0a9e,anchor);putWord(0x080a,playerAddress);m[0x14f0]=shared.turn;
 const r=new Uint8Array(8),stack=[];let pc=enemy.type==='ghost'?0x0d17:0x11c5,z=false,c=false,s=false,face;
 const pair=n=>r[n*2]*256+r[n*2+1],setPair=(n,v)=>{r[n*2]=v>>8;r[n*2+1]=v&255};
 const read=n=>n===6?m[pair(2)]:r[n],write=(n,v)=>{if(n===6)m[pair(2)]=v;else r[n]=v};
 const word=()=>{const n=m[pc]|m[pc+1]<<8;pc+=2;return n};
 const flag=v=>{z=(v&255)===0;s=Boolean(v&128)};
 const condition=n=>[!z,z,!c,c,true,false,!s,s][n];
 const finish=(dx=0,dy=0,kill=false,sleepAt)=>({decision:{dx,dy,face,kill,...sleepAt?{sleepAt}:{}},pathSteps:m[ownAttribute],turn:m[0x14f0]});
 const commit={0x0dae:['left',-1,0],0x0e8e:['right',1,0],0x122e:['up',0,-1],0x12ff:['down',0,1],0x1377:['left',-1,0],0x13de:['right',1,0]};
 for(let step=0;step<1200;step++){
  trace({pc:pc.toString(16),a:r[7],hl:pair(2).toString(16),z,c,s});
  if(commit[pc]){const [f,dx,dy]=commit[pc];face=f;return finish(dx,dy)}
  if(pc===0x13f2)return finish();
  if(pc===0x0df6){face='right';return finish()}
  if(pc===0x0ebe){face='left';return finish()}
  if(pc===0x0f3f||pc===0x131a)return finish(0,0,true);
  if(pc===0x0e16||pc===0x0e1f){const a=m[0x07a0]|m[0x07a1]<<8;return finish(0,0,false,{dx:(a&63)-(anchor&63),dy:pc===0x0e16?0:1})}
  const at=pc,o=m[pc++];
  if(o>=0x40&&o<0x80){assert.notEqual(o,0x76);write(o>>3&7,read(o&7))}
  else if(o>=0x80&&o<0xc0){const v=read(o&7),op=o>>3&7;if(op===7){const n=r[7]-v;c=n<0;flag(n)}else if(op===4){r[7]&=v;c=false;flag(r[7])}else if(op===5){r[7]^=v;c=false;flag(r[7])}else if(op===6){r[7]|=v;c=false;flag(r[7])}else throw Error('Unexpected ALU '+o.toString(16))}
  else if((o&0xc7)===6)write(o>>3&7,m[pc++]);
  else if((o&0xc7)===5){const n=o>>3&7,v=(read(n)-1)&255;write(n,v);flag(v)}
  else if((o&0xcf)===1)setPair(o>>4,word());
  else if((o&0xcf)===3)setPair(o>>4,pair(o>>4)+1);
  else if((o&0xcf)===11)setPair(o>>4,pair(o>>4)-1);
  else if((o&0xcf)===9){const n=pair(2)+pair(o>>4);c=n>65535;setPair(2,n)}
  else if(o===0x2a){const a=word();setPair(2,m[a]|m[a+1]<<8)}
  else if(o===0x22)putWord(word(),pair(2));
  else if(o===0x3a)r[7]=m[word()];
  else if(o===0x32)m[word()]=r[7];
  else if(o===0x1f){const old=r[7];r[7]=(old>>1)|(c?128:0);c=Boolean(old&1)}
  else if(o===0xeb){const h=pair(2);setPair(2,pair(1));setPair(1,h)}
  else if(o===0xe6){r[7]&=m[pc++];c=false;flag(r[7])}
  else if(o===0xfe){const v=m[pc++],n=r[7]-v;c=n<0;flag(n)}
  else if(o===0xc3)pc=word();
  else if((o&0xc7)===0xc2){const dest=word();if(condition(o>>3&7))pc=dest}
  else if(o===0xcd){
   const dest=word();
   if(dest===0x0d08){m[0x8800]=randomByte();putWord(0x0a95,0x8800);setPair(2,0x8800);r[7]=8;z=false;s=true;c=true}
   else if(dest===0x0a11){const a=pair(2),offset=a-0xc000;r[0]=r[5];setPair(2,0x9000+Math.floor(Math.floor(offset/64)/9)*64+(offset%64));c=false;z=false;s=true}
   else if(dest===0x1266){/* drawing the old pose cannot change the decision */}
   else if(dest===0x0583||dest===0x058b){const source=pair(1);face=({0x05a7:'down',0x1130:'up',0x110a:'left',0x1156:'right'})[source];}
   else{stack.push(pc);pc=dest}
  }
  else if(o===0xc9)pc=stack.pop();
  else if(o===0xe5)stack.push(pair(2));
  else if(o===0xe1)setPair(2,stack.pop());
  else if(o===0xf5)stack.push({a:r[7],z,c,s});
  else if(o===0xf1){const f=stack.pop();r[7]=f.a;z=f.z;c=f.c;s=f.s}
  else throw Error('Unsupported opcode '+o.toString(16)+' at '+at.toString(16));
 }
 throw Error('Native enemy driver did not finish at '+pc.toString(16));
}
