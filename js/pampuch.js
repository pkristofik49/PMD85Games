/* Original Pampuch rules execute on the PMD core; the browser adds pause/save. */
(() => {
  const SAVE_VERSION=2,STOP_GAME_OVER=0x08bd;
  class Pampuch {
    constructor(map=1){this.machine=new Pmd85();this.machine.boot(map);this.state='ready';this.events=[];this.ticks=0;this.startedAt=this.machine.cpu.cycles;this.completedMaps=new Set();this.pose={address:this.machine.word(0x0c6a),map:this.map,closed:false,visible:true};}
    observePresentation(pc){
      if(pc===0x0805){this.pose.visible=false;return;}
      const address=this.machine.word(0x0c6a),distance=Math.abs(address-this.pose.address);
      if(!this.pose.visible||this.pose.map!==this.map){this.pose.closed=false;this.pose.address=address;}
      else if(pc===0x0263&&address!==this.pose.address){this.pose.closed=(distance===1||distance===384)?!this.pose.closed:false;this.pose.address=address;}
      this.pose.visible=true;this.pose.map=this.map;
    }
    get map(){return this.machine.memory[0x0c7d];}
    get level(){return this.machine.memory[0x0b48];}
    get score(){const m=this.machine.memory;return m[0x0b4b]*10000+m[0x0b4c]*100+m[0x0b4d];}
    get lives(){return this.state==='over'?0:this.machine.memory[0x0c7c];}
    get time(){const m=this.machine.memory;return m[0x0b49]*100+m[0x0b4a];}
    get remaining(){const value=this.machine.word(0x0c6c);return value>432?0:value;}
    get player(){return this.actor(0x0c6a);}
    get ghosts(){return [0x0c6e,0x0c70,0x0c72,0x0c74].map(a=>this.actor(a));}
    actor(address){const pointer=this.machine.word(address)-0xc000;return{x:(pointer&63),y:(Math.floor(pointer/64)-24)/6};}
    start(){if(this.state==='ready')this.state='playing';}
    turn(direction,pressed=true){if(this.state==='playing')this.machine.key(direction,pressed);}
    release(){this.machine.release();}
    takeEvents(){return this.events.splice(0);}
    advance(milliseconds){
      if(this.state!=='playing'||!Number.isFinite(milliseconds)||milliseconds<=0)return;
      const start=this.machine.cpu.cycles,control=this.machine.portC&7;
      this.machine.advance(milliseconds*Pmd85.CLOCK/1000,{stopAt:STOP_GAME_OVER,onLevelComplete:map=>this.completedMaps.add(map),onPresentation:pc=>this.observePresentation(pc)});this.ticks++;
      this.events.push({start,end:this.machine.cpu.cycles,control,edges:this.machine.edges.splice(0)});
      if(this.machine.cpu.pc===STOP_GAME_OVER){this.state='over';this.release();}
    }
    snapshot(){return{version:SAVE_VERSION,state:this.state,ticks:this.ticks,startedAt:this.startedAt,completedMaps:[...this.completedMaps],pose:{...this.pose},machine:this.machine.snapshot()};}
    static restore(value){
      if(!value||value.version!==SAVE_VERSION||!['ready','playing','paused','over'].includes(value.state))return null;
      const integer=(n,lo,hi)=>Number.isInteger(n)&&n>=lo&&n<=hi;
      const s=value.machine,c=s?.cpu;
      if(!s||!c||!Array.isArray(s.ram)||s.ram.length!==49152||!s.ram.every(n=>integer(n,0,255))||
        !Array.isArray(c.r)||c.r.length!==8||!c.r.every(n=>integer(n,0,255))||
        !integer(c.pc,0,65535)||!integer(c.sp,0,65535)||!integer(c.f,0,255)||!integer(c.cycles,0,Number.MAX_SAFE_INTEGER)||
        typeof c.halted!=='boolean'||typeof c.interrupts!=='boolean'||
        !['portA','portC','control'].every(k=>integer(s[k],0,255))||
        !Number.isFinite(s.targetCycles)||s.targetCycles<0||s.targetCycles>Number.MAX_SAFE_INTEGER||
        (value.state!=='over'&&(s.targetCycles>c.cycles||s.targetCycles<c.cycles-32))||
        !integer(value.ticks,0,Number.MAX_SAFE_INTEGER)||!integer(value.startedAt,0,c.cycles))return null;
      if(value.completedMaps!==undefined&&(!Array.isArray(value.completedMaps)||value.completedMaps.length>11||!value.completedMaps.every(n=>integer(n,1,11))))return null;
      const game=new Pampuch();game.machine.restore(s);game.ticks=value.ticks;game.startedAt=value.startedAt;
      const pose=value.pose;
      if(pose&&integer(pose.address,0xc000,0xffff)&&integer(pose.map,1,11)&&typeof pose.closed==='boolean'&&typeof pose.visible==='boolean')game.pose={...pose};
      else game.pose={address:game.machine.word(0xc6a),map:game.map,closed:false,visible:value.state!=='over'};
      // Older native saves always started at map 1 and had no map picker.
      game.completedMaps=new Set(value.completedMaps??Array.from({length:Math.min(11,Math.max(0,game.level-1))},(_,i)=>i+1));
      game.state=value.state==='playing'?'paused':value.state;return game;
    }
  }
  globalThis.Pampuch=Pampuch;
})();
