// Runs the original 1987 PMD player collision branches in isolation, not a remake.
// Input: games-vbg.ptp from https://pmd85.borik.net/?action=download&did=8
// Rendering, death and stone-breaking calls are recorded at their original entry points.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const tape=fs.readFileSync(process.argv[2]),blocks=[];
for(let p=0;p<tape.length;){const n=tape.readUInt16LE(p);blocks.push(tape.subarray(p+2,p+2+n));p+=n+2}
const header=blocks.findIndex(b=>b.length===63&&b.subarray(54,62).toString()==='*FLAPPY*');
assert.ok(header>=0,'Original *FLAPPY* tape header');
// The headerless program recording includes 0x71 leading bytes before address 0000.
const program=blocks[header+3].subarray(0x71);
assert.deepEqual([...program.subarray(0x1c15,0x1c1a)],[0x3e,3,0x32,4,0x1c]);
const word=(m,p)=>m[p]|m[p+1]<<8;
function bitmap(m,address,source){
 for(let col=0;col<2;col++){
  let row=0;while(program[source]!==255){m[address+col+row*64]=program[source++];row++}source++;
 }
}
function run(direction,enemy,stone){
 const m=new Uint8Array(65536);m.set(program);m.fill(0,0xc000);
 const p=0xd010; m[0x080a]=p&255;m[0x080b]=p>>8;
 const offset={right:2,left:-2,up:-0x480,down:0x480}[direction];
 if(stone)bitmap(m,p+offset,stone==='ordinary'?0x0158:0x0132);
 bitmap(m,p+offset*(stone?2:1),enemy);
 const r=new Uint8Array(8),pairs=[0,2,4],stack=[];
 let pc={up:0x1726,right:0x1820,down:0x18b4,left:0x1940}[direction],z=false,carry=false,dead=false,broken=false;
 const pair=n=>r[pairs[n]]*256+r[pairs[n]+1];
 const setPair=(n,v)=>{r[pairs[n]]=v>>8;r[pairs[n]+1]=v&255};
 const read=n=>n===6?m[pair(2)]:r[n];
 const write=(n,v)=>{if(n===6)m[pair(2)]=v;else r[n]=v};
 const nextWord=()=>{const n=word(m,pc);pc+=2;return n};
 const condition=n=>[!z,z,!carry,carry][n];
 for(let step=0;step<300;step++){
  if(pc===0x1b87)return{dead,broken};
  const at=pc,o=m[pc++];
  if(o>=0x40&&o<=0x7f){assert.notEqual(o,0x76);write(o>>3&7,read(o&7))}
  else if((o&0xc7)===6)write(o>>3&7,m[pc++]);
  else if(o===0x21||o===0x11||o===0x01)setPair(o>>4,nextWord());
  else if(o===0x2a){const a=nextWord();setPair(2,word(m,a))}
  else if(o===0x22){const a=nextWord();m[a]=r[5];m[a+1]=r[4]}
  else if(o===0x3a)r[7]=m[nextWord()];
  else if(o===0x32)m[nextWord()]=r[7];
  else if(o===0x23)setPair(2,pair(2)+1);
  else if(o===0x2b)setPair(2,pair(2)-1);
  else if(o===0x19){const sum=pair(2)+pair(1);carry=sum>65535;setPair(2,sum)}
  else if(o===0xa7){z=r[7]===0;carry=false}
  else if(o===0xfe){const n=m[pc++];z=r[7]===n;carry=r[7]<n}
  else if(o===0xc3)pc=nextWord();
  else if([0xc2,0xca,0xd2,0xda].includes(o)){const dest=nextWord();if(condition(o>>3&3))pc=dest}
  else if(o===0xcd){
   const dest=nextWord();
   if(dest===0x0a02)dead=true;
   else if(dest===0x1775)broken=true;
   else if(![0x054e,0x0556,0x0a57].includes(dest))throw Error('Unexpected call '+dest.toString(16));
  }
  else if(o===0xe5)stack.push(pair(2));
  else if(o===0xe1)setPair(2,stack.pop());
  else throw Error('Unsupported instruction '+o.toString(16)+' at '+at.toString(16));
 }
 throw Error('Native collision branch did not finish');
}
for(const [name,source]of Object.entries({ghost:0x041f,sleepingGhost:0x0445,frog:0x05a7,sleepingFrog:0x0f6b})){
 for(const direction of ['left','right','up','down'])assert.deepEqual(run(direction,source),{dead:true,broken:false},name+' '+direction);
 for(const direction of ['left','right']){
  assert.deepEqual(run(direction,source,'ordinary'),{dead:false,broken:true},name+' ordinary '+direction);
  assert.deepEqual(run(direction,source,'crystal'),{dead:false,broken:false},name+' crystal '+direction);
 }
}
console.log('Original PMD 1987: contact with awake AND sleeping enemies is lethal in all four directions; side pressure breaks the ordinary stone, preserves the crystal and does not kill the enemy.');
console.log('32 original-code scenarios OK; program SHA256 '+crypto.createHash('sha256').update(program).digest('hex'));
