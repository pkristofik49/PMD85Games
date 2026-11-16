import {retroData} from '../assets/retro-data.js';
const colors=new Map();
export const retroModes=['sharp','msx','nes'];
export function drawRetro(ctx,frame,x,y,width=frame.width*.75,height=frame.height,flip=false){
 for(let row=0;row<frame.height;row++)for(let col=0;col<frame.width;col++){
  const color=frame.pixels[row*frame.width+col];if(!color)continue;
  if(!colors.has(color))colors.set(color,'#'+color.toString(16).padStart(6,'0'));
  ctx.fillStyle=colors.get(color);ctx.fillRect(x+(flip?frame.width-1-col:col)*width/frame.width,y+row*height/frame.height,width/frame.width,height/frame.height);
 }
}
export function retroSet(mode){return retroData[mode]}
export function retroPlayer(set,player){
 const direction=player.dx<0?'LEFT':player.dx>0?'RIGHT':player.dy<0?'UP':'DOWN';
 return player.crushed?set.CHICKEN_CRASH:set['CHICKEN_'+direction+'_'+(player.walking&&player.walkFrame%2?2:1)];
}
export function retroEnemy(set,enemy,ticks){
 if(enemy.crushed)return set[enemy.type==='frog'?'RED_CRASH':'BLUE_CRASH'];
 const direction=enemy.type==='ghost'?(enemy.dx>0?'RIGHT':'LEFT'):enemy.dx<0?'LEFT':enemy.dx>0?'RIGHT':enemy.dy<0?'UP':'DOWN';
 const step=!enemy.sleep&&Number.isInteger(enemy.stepTick)&&ticks-enemy.stepTick<2?2:1;
 return set[(enemy.type==='frog'?'RED_':'BLUE_')+direction+'_'+step];
}
