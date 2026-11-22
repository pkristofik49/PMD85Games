/* BOULD+4 executes its own maze, caves, physics and sound on the PMD core. */
(() => {
  const SAVE_VERSION=1,STOP_GAME_OVER=0x3235;
  const keys={up:[2,4],down:[1,16],left:[12,4],right:[14,4]};
  class BoulderMachine extends Pmd85 {
    input(port){const value=super.input(port);return (port&0x8f)===0x85&&this.action?value&~0x40:value;}
    key(direction,pressed){if(direction==='action'){this.action=pressed;return;}const key=keys[direction];if(!key)return;const [column,mask]=key;if(pressed)this.columns[column]|=mask;else this.columns[column]&=~mask;}
    release(){super.release();this.action=false;}
    boot(){
      this.cpu.pc=0x8000;this.until(0x84a1);
      this.memory.set(BoulderNativeData.program);this.cpu.pc=0x4002;this.until(0x84a1);
      // The original monitor accepts H only after key release (debouncing).
      this.columns[5]=8;this.until(0x84d9);this.release();this.until(0x3238);this.until(0x3320);
      this.edges=[];this.targetCycles=this.cpu.cycles;
    }
  }
  class Boulder {
    constructor(){this.machine=new BoulderMachine();this.machine.boot();this.state='ready';this.events=[];this.ticks=0;this.startedAt=this.machine.cpu.cycles;}
    get lives(){const m=this.machine.memory;return this.state==='over'?0:(m[0x1dbb]-48)*100+(m[0x1dbc]-48)*10+m[0x1dbd]-48;}
    start(){if(this.state==='ready')this.state='playing';}
    turn(direction,pressed=true){if(this.state==='playing')this.machine.key(direction,pressed);}
    release(){this.machine.release();}
    takeEvents(){return this.events.splice(0);}
    advance(milliseconds){
      if(this.state!=='playing'||!Number.isFinite(milliseconds)||milliseconds<=0)return;
      const start=this.machine.cpu.cycles,control=this.machine.portC&7;
      this.machine.advance(milliseconds*Pmd85.CLOCK/1000,{stopAt:STOP_GAME_OVER});this.ticks++;
      this.events.push({start,end:this.machine.cpu.cycles,control,edges:this.machine.edges.splice(0)});
      if(this.machine.cpu.pc===STOP_GAME_OVER){this.state='over';this.release();}
    }
    snapshot(){return{version:SAVE_VERSION,state:this.state,ticks:this.ticks,startedAt:this.startedAt,machine:this.machine.snapshot()};}
    static restore(value){
      if(!value||value.version!==SAVE_VERSION||!['ready','playing','paused','over'].includes(value.state))return null;
      const integer=(n,lo,hi)=>Number.isInteger(n)&&n>=lo&&n<=hi,s=value.machine,c=s?.cpu;
      if(!s||!c||!Array.isArray(s.ram)||s.ram.length!==49152||!s.ram.every(n=>integer(n,0,255))||
        !Array.isArray(c.r)||c.r.length!==8||!c.r.every(n=>integer(n,0,255))||
        !integer(c.pc,0,65535)||!integer(c.sp,0,65535)||!integer(c.f,0,255)||!integer(c.cycles,0,Number.MAX_SAFE_INTEGER)||
        typeof c.halted!=='boolean'||typeof c.interrupts!=='boolean'||
        !['portA','portC','control'].every(k=>integer(s[k],0,255))||
        !Number.isFinite(s.targetCycles)||s.targetCycles<0||s.targetCycles>Number.MAX_SAFE_INTEGER||
        (value.state!=='over'&&(s.targetCycles>c.cycles||s.targetCycles<c.cycles-32))||
        !integer(value.ticks,0,Number.MAX_SAFE_INTEGER)||!integer(value.startedAt,0,c.cycles))return null;
      const game=new Boulder();game.machine.restore(s);game.ticks=value.ticks;game.startedAt=value.startedAt;
      game.state=value.state==='playing'?'paused':value.state;return game;
    }
  }
  globalThis.Boulder=Boulder;
})();
