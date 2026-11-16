export const GRAPHICS_KEY='flappy.graphics';
export const graphicsModes=['mono','color','sharp','msx','nes','modern'];
export const titleScreens={
 mono:{src:'./assets/title-screen.png',width:288,height:256},
 color:{src:'./assets/title-pmd85-3.gif',width:576,height:512},
 sharp:{src:'./assets/title-sharp.png',width:320,height:200},
 msx:{src:'./assets/title-msx.png',width:256,height:192},
 nes:{src:'./assets/title-nes.png',width:256,height:224}
};
export function loadGraphics(storage){
  try{const saved=(storage??globalThis.localStorage).getItem(GRAPHICS_KEY);if(graphicsModes.includes(saved))return saved}catch{/* Keep the default when storage is unavailable. */}
  return 'mono';
}
export async function loadModernSprites(){
  const image=new Image();image.src=new URL('../assets/modern-sprites.png',import.meta.url).href;
  const crystal=new Image();crystal.src=new URL('../assets/modern-crystal.png',import.meta.url).href;
  const walk=new Image();walk.src=new URL('../assets/modern-mole-walk.png',import.meta.url).href;
  await Promise.all([image.decode(),crystal.decode(),walk.decode()]);
  return {image,frames:trimFrames(image,4),crystal:{image:crystal,frame:trimFrames(crystal,1)[0]},walk:{image:walk,frames:walkingFrames(walk)}};
}
function walkingFrames(image){
  const frames=trimFrames(image,4),cellWidth=image.naturalWidth/4,cellHeight=image.naturalHeight/4;
  // A shared crop keeps torso size and placement stable while the feet move.
  const left=Math.min(...frames.map((f,i)=>f.x-Math.floor(i%4*cellWidth)));
  const top=Math.min(...frames.map((f,i)=>f.y-Math.floor(Math.floor(i/4)*cellHeight)));
  const right=Math.max(...frames.map((f,i)=>f.x+f.width-Math.floor(i%4*cellWidth)));
  const bottom=Math.max(...frames.map((f,i)=>f.y+f.height-Math.floor(Math.floor(i/4)*cellHeight)));
  return frames.map((_,i)=>({x:Math.floor(i%4*cellWidth)+left,y:Math.floor(Math.floor(i/4)*cellHeight)+top,width:right-left,height:bottom-top}));
}
function trimFrames(image,columns){
  const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data,frames=[];
  // Trim transparent cell padding without resampling or changing the source PNG.
  for(let i=0;i<columns*columns;i++){
    const col=i%columns,row=Math.floor(i/columns),left=Math.floor(col*canvas.width/columns),top=Math.floor(row*canvas.height/columns);
    const right=Math.floor((col+1)*canvas.width/columns),bottom=Math.floor((row+1)*canvas.height/columns);
    let x1=right,y1=bottom,x2=left,y2=top;
    for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(pixels[(y*canvas.width+x)*4+3]>96){x1=Math.min(x1,x);y1=Math.min(y1,y);x2=Math.max(x2,x);y2=Math.max(y2,y)}
    if(x2<x1||y2<y1)throw Error('Empty sprite cell');
    frames.push({x:x1,y:y1,width:x2-x1+1,height:y2-y1+1});
  }
  return frames;
}
export function modernPlayerFrame(player,progress=0){
  const base=player.dx<0?0:player.dx>0?2:player.dy<0?6:4;
  if(player.walking&&player.dx){
    const phase=((player.walkFrame+3)%4)*2+Math.min(1,Math.max(0,progress))*2;
    return (player.dx<0?16:24)+Math.floor(phase)%8;
  }
  return base+(player.walking?player.walkFrame%2:0);
}
export function modernEnemyFrame(enemy){
  return enemy.type!=='frog'?12:enemy.dx<0?8:enemy.dx>0?9:enemy.dy<0?11:10;
}
export function modernSprite(ctx,atlas,index,x,y,width,height,{flip=false,opacity=1}={}){
  const source=index>=16?atlas.walk:index===13&&atlas.crystal?atlas.crystal:null;
  const frame=index>=16?source.frames[index-16]:source?source.frame:atlas.frames[index];
  ctx.save();ctx.globalAlpha*=opacity;
  ctx.translate(x+(flip?width:0),y);if(flip)ctx.scale(-1,1);
  ctx.drawImage(source?source.image:atlas.image,frame.x,frame.y,frame.width,frame.height,0,0,width,height);
  ctx.restore();
}
export function pcTitle(atlas,title,subtitle,version){
 const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=800;const ctx=canvas.getContext('2d');
 const gradient=ctx.createLinearGradient(0,0,0,800);gradient.addColorStop(0,'#213b59');gradient.addColorStop(1,'#101924');ctx.fillStyle=gradient;ctx.fillRect(0,0,1280,800);
 ctx.fillStyle='#131f2d';for(let y=0;y<800;y+=32)for(let x=-(y%64?24:0);x<1280;x+=48){ctx.fillRect(x+2,y+2,44,28)}
 ctx.textAlign='center';ctx.font='900 136px "Courier New", monospace';ctx.fillStyle='#081322';ctx.fillText(title,644,192);ctx.fillStyle='#f2df9d';ctx.fillText(title,640,184);
 ctx.font='600 28px "Courier New", monospace';ctx.fillStyle='#9fbccf';ctx.fillText(subtitle,640,240);
 modernSprite(ctx,atlas,2,330,320,300,300);modernSprite(ctx,atlas,13,760,400,210,200);
 ctx.fillStyle='#155ca7';ctx.fillRect(755,600,220,20);ctx.fillStyle='#72e1ff';ctx.fillRect(755,600,220,4);
 ctx.fillStyle='#9bbdba';ctx.font='600 22px "Courier New", monospace';ctx.fillText(version,640,724);
 return {src:canvas.toDataURL(),width:1280,height:800};
}
