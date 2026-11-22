/* Original AUTO code owns road generation, steering, crashes, timing and sound. */
(() => {
  const SAVE_VERSION=1,FINISH=0x230f;
  class AutoMachine extends Pmd85 {
    input(port){const value=super.input(port);return(port&0x8f)===0x85&&this.steerLeft?value&~0x20:value;}
    key(direction,pressed){if(direction==='left')this.steerLeft=pressed;else if(direction==='right'){if(pressed)this.columns[4]|=16;else this.columns[4]&=~16;}}
    release(){super.release();this.steerLeft=false;}
    boot(){this.cpu.pc=0x8000;this.until(0x84a1);this.memory.set(AutoNativeData.program,AutoNativeData.address);this.cpu.sp=0x7ff0;this.cpu.pc=0x2000;this.until(0x2236);this.edges=[];this.targetCycles=this.cpu.cycles;}
  }
  class AutoGame {
    constructor(){this.machine=new AutoMachine();this.machine.boot();this.state='ready';this.events=[];this.ticks=0;this.startedAt=this.machine.cpu.cycles;}
    get crashes(){const m=this.machine.memory;return(m[0x22a3]-48)*100+(m[0x22a4]-48)*10+m[0x22a5]-48;}
    get lapsRemaining(){return this.machine.memory[0x239d];}
    start(){if(this.state==='ready')this.state='playing';}
    turn(direction,pressed=true){if(this.state==='playing')this.machine.key(direction,pressed);}
    release(){this.machine.release();}
    takeEvents(){return this.events.splice(0);}
    advance(milliseconds){
      if(this.state!=='playing'||!Number.isFinite(milliseconds)||milliseconds<=0)return;
      const start=this.machine.cpu.cycles,control=this.machine.portC&7;
      this.machine.advance(milliseconds*Pmd85.CLOCK/1000,{stopAt:FINISH});this.ticks++;
      this.events.push({start,end:this.machine.cpu.cycles,control,edges:this.machine.edges.splice(0)});
      if(this.machine.cpu.pc===FINISH){this.state='over';this.release();}
    }
    snapshot(){return{version:SAVE_VERSION,state:this.state,ticks:this.ticks,startedAt:this.startedAt,machine:this.machine.snapshot()};}
    static restore(value){
      if(!value||value.version!==SAVE_VERSION||!['ready','playing','paused','over'].includes(value.state))return null;
      const integer=(n,lo,hi)=>Number.isInteger(n)&&n>=lo&&n<=hi,s=value.machine,c=s?.cpu;
      if(!s||!c||!Array.isArray(s.ram)||s.ram.length!==49152||!s.ram.every(n=>integer(n,0,255))||
        !Array.isArray(c.r)||c.r.length!==8||!c.r.every(n=>integer(n,0,255))||
        !integer(c.pc,0,65535)||!integer(c.sp,0,65535)||!integer(c.f,0,255)||!integer(c.cycles,0,Number.MAX_SAFE_INTEGER)||
        typeof c.halted!=='boolean'||typeof c.interrupts!=='boolean'||!['portA','portC','control'].every(k=>integer(s[k],0,255))||
        !Number.isFinite(s.targetCycles)||s.targetCycles<0||s.targetCycles>Number.MAX_SAFE_INTEGER||
        (value.state!=='over'&&(s.targetCycles>c.cycles||s.targetCycles<c.cycles-32))||
        !integer(value.ticks,0,Number.MAX_SAFE_INTEGER)||!integer(value.startedAt,0,c.cycles))return null;
      const game=new AutoGame();game.machine.restore(s);game.ticks=value.ticks;game.startedAt=value.startedAt;game.state=value.state==='playing'?'paused':value.state;return game;
    }
  }
  globalThis.AutoGame=AutoGame;
})();
