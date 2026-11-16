import {pmdProbes} from '../assets/pmd-ai-probes.js';
const directions={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const facing=e=>e.dx<0?'Left':e.dx>0?'Right':e.dy<0?'Up':'Down';
const inside=(x,y,a)=>x>=a.x&&x<a.x+a.w&&y>=a.y&&y<a.y+a.h;

// The PMD drivers inspect individual bitmap bytes, including invisible high-bit
// tags. Reconstruct those probes independently of the selected visual skin.
export function enemyField(game,enemy){
 const items=[];
 const add=(entity,bitmap)=>items.push({entity,bitmap});
 if(game.goal)add(game.goal,pmdProbes.goal);
 for(const rock of game.rocks)add(rock,pmdProbes[rock.egg?'crystal':'rock']);
 for(const corpse of game.corpses)add(corpse,pmdProbes[corpse.type==='frog'?'frogCorpse':'ghostCorpse']);
 for(const other of game.enemies)add(other,pmdProbes[other.type+(other.sleep?'Sleep':other.type==='ghost'?(other.dx<0?'Left':'Right'):facing(other))]);
 for(const mushroom of game.mushrooms)add(mushroom,pmdProbes.mushroom);
 for(const shot of game.shots)add(shot,pmdProbes.mushroom);
 add(game.player,pmdProbes['player'+facing(game.player)]);
 return {
  read(dx,row){
   const x=enemy.x+dx,y=enemy.y*9+row;
   if(x<0||x>=40||y<0||y>=22*9)return pmdProbes.wall[0][((y%18)+18)%18];
   for(let i=items.length-1;i>=0;i--){const {entity,bitmap}=items[i],column=x-entity.x,line=y-entity.y*9;
    if(column>=0&&column<bitmap.length&&line>=0&&line<bitmap[column].length)return bitmap[column][line];
   }
   if(game.walls.has(`${x},${Math.floor(y/9)}`))return pmdProbes.wall[0][y%18];
   return 0;
  },
  attribute(dx,row){
   const x=enemy.x+dx,y=Math.floor((enemy.y*9+row)/9);
   const other=game.enemies.find(e=>inside(x,y,e));
   if(other)return other.sleep||other.pathSteps||0;
   return game.shots.find(s=>inside(x,y,s))?.life??0;
  }
 };
}

// Hand translation of the original 8080 decision branches, not a new AI.
// One call replaces one existing 600 ms enemy movement opportunity.
export function decideEnemy(enemy,player,field,randomByte,shared){
 const read=(x,y)=>field.read(x,y),attribute=(x,y)=>field.attribute(x,y);
 const stop=face=>({dx:0,dy:0,face,kill:false});
 const move=face=>({dx:directions[face][0],dy:directions[face][1],face,kill:false});
 const kill=()=>({dx:0,dy:0,face:undefined,kill:true});
 if(enemy.type==='ghost'){
  const random=randomByte(); // 0D08 is called even when the player is found.
  let direction;
  for(let i=1;i<=10;i++){const code=read(-i,0);if(code===0xc0){direction='left';break}if(code===0x37||code===0x3e)break}
  if(!direction)for(let i=2;i<=11;i++){const code=read(i,0);if(code===0xc0){direction='right';break}if(code===0x37||code===0x3e)break}
  direction??=(random&1)?'left':'right'; // two RARs select the original low bit.
  const x=direction==='left'?-1:2,top=read(x,0),bottom=read(x,9);
  if(top===0xc0||(top!==0&&read(x,-9)===0xc0)||(!top&&bottom===0xc0))return kill();
  if(top||bottom)return stop(direction==='left'?'right':'left');
  if(read(x,8)===4)return {...stop(),sleepAt:{dx:x,dy:0}};
  if(direction==='left'&&read(x,17)===4&&!read(x,18))return {...stop(),sleepAt:{dx:x,dy:1}};
  return move(direction);
 }

 let label;
 if(enemy.pathSteps>0){enemy.pathSteps--;label=({0x37:'down',0x3e:'left',0x1e:'up',0x3c:'right'})[read(0,8)]??(randomByte()<128?'horizontal':'vertical')}
 else{shared.turn=0;label=randomByte()<128?'horizontal':'vertical'}
 // 14F0 is shared by the native frog driver; keep it across all frogs.
 const fail=axis=>{
  if(shared.turn===0){shared.turn=axis==='horizontal'?0xe0:0x0e;return axis==='horizontal'?'vertical':'horizontal'}
  enemy.pathSteps=randomByte()&7;
  const byte=randomByte();
  return axis==='horizontal'?stop(byte<128?'up':'down'):stop(byte<128?'right':'left');
 };
 for(let guard=0;guard<12;guard++){
  if(label==='horizontal'){
   if(enemy.x===player.x){
    enemy.pathSteps=4;shared.turn=4;
    label=enemy.y<player.y?'down':'up';
    const row=label==='up'?-1:18;
    if((read(0,row)&63)||(read(1,row)&63))return stop();
   }else label=enemy.x<player.x?'right':'left';
  }else if(label==='vertical'){
   if(enemy.y===player.y){
    enemy.pathSteps=4;shared.turn=4;
    label=enemy.x<player.x?'right':'left';const x=label==='left'?-1:2;
    if((read(x,0)&63)||(read(x,9)&63))return stop();
   }else label=enemy.y<player.y?'down':'up';
  }
  let result;
  if(label==='up'){
   if(read(0,-18)===0xc0||read(1,-18)===0xc0)return kill();
   if(read(0,-1))result=fail('vertical');
   else if(read(1,-1))result=fail('horizontal'); // Native asymmetry, 1215.
   else return move('up');
  }else if(label==='down'){
   if(read(1,18)===0xc0)return kill();
   if(attribute(0,18))return stop();
   if(read(0,18))result=fail('vertical');
   else{
    if(attribute(1,18))return stop();
    if(read(1,18))result=fail('vertical');
    else return move('down');
   }
  }else{
   const x=label==='left'?-1:2;
   if(read(x,-9)===0xc0||read(x,0)===0xc0)return kill();
   if(read(x,0)||read(x,8)===4)result=fail('horizontal');
   else{
    let bottomRow=9;
    if(read(x,17)===4){
     if(!read(x,label==='left'?26:18))result=fail('horizontal');
     else if(label==='right')bottomRow=1;
    }
    if(!result){
     if(read(x,bottomRow)===0xc0)return kill();
     if(!read(x,bottomRow))return move(label);
     if(label==='right')return stop(); // 13DB does not retry the other axis.
     result=fail('horizontal');
    }
   }
  }
  if(typeof result!=='string')return result;
  label=result;
 }
 throw Error('PMD frog decision did not terminate');
}
