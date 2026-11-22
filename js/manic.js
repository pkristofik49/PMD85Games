/* MANIC+ executes its original title music, caves, physics, sprites and sound. */
(() => {
  const SAVE_VERSION=1,INTRO_END=0x7c66,GAME_OVER=0x7da4;
  class ManicMachine extends Pmd85 {
    input(port){const value=super.input(port);return(port&0x8f)===0x85&&this.jump?value&~0x20:value;}
    key(direction,pressed){if(direction==='action'||direction==='up'){this.jump=pressed;return;}const column={left:12,right:14}[direction];if(column===undefined)return;if(pressed)this.columns[column]|=4;else this.columns[column]&=~4;}
    release(){super.release();this.jump=false;}
    boot(){this.cpu.pc=0x8000;this.until(0x84a1);this.memory.set(ManicNativeData.program);this.cpu.pc=0;this.until(0x34a1);this.edges=[];this.targetCycles=this.cpu.cycles;}
    start(){
      // Native STOP skips the title tune and selects human play, not attract mode.
      this.release();this.cpu.pc=0x7bd7;this.columns[14]=16;this.until(0x7c75);this.release();this.until(0x7ce1);
      this.edges=[];this.targetCycles=this.cpu.cycles;
    }
  }
  class ManicGame {
    constructor(){this.machine=new ManicMachine();this.machine.boot();this.state='ready';this.events=[];this.ticks=0;this.startedAt=this.machine.cpu.cycles;this.introFinished=false;}
    get level(){return this.machine.memory[0x7348]+1;}
    get lives(){return this.state==='over'?0:this.machine.memory[0x7e88]+1;}
    start(){if(this.state==='ready'){this.events=[];this.machine.start();this.introFinished=true;this.state='playing';}}
    turn(direction,pressed=true){if(this.state==='playing')this.machine.key(direction,pressed);}
    release(){this.machine.release();}
    takeEvents(){return this.events.splice(0);}
    advance(milliseconds){
      const intro=this.state==='ready'&&!this.introFinished;
      if((this.state!=='playing'&&!intro)||!Number.isFinite(milliseconds)||milliseconds<=0)return;
      const start=this.machine.cpu.cycles,control=this.machine.portC&7;
      this.machine.advance(milliseconds*Pmd85.CLOCK/1000,{stopAt:intro?INTRO_END:GAME_OVER});this.ticks++;
      this.events.push({start,end:this.machine.cpu.cycles,control,edges:this.machine.edges.splice(0)});
      if(intro&&this.machine.cpu.pc===INTRO_END){this.introFinished=true;this.machine.targetCycles=this.machine.cpu.cycles;}
      if(!intro&&this.machine.cpu.pc===GAME_OVER){this.state='over';this.release();}
    }
    snapshot(){return{game:'manic',version:SAVE_VERSION,state:this.state,introFinished:this.introFinished,ticks:this.ticks,startedAt:this.startedAt,machine:this.machine.snapshot()};}
    static restore(value){
      if(!value||value.game!=='manic'||value.version!==SAVE_VERSION||!['ready','playing','paused','over'].includes(value.state)||typeof value.introFinished!=='boolean')return null;
      const integer=(n,lo,hi)=>Number.isInteger(n)&&n>=lo&&n<=hi,s=value.machine,c=s?.cpu;
      if(!s||!c||!Array.isArray(s.ram)||s.ram.length!==49152||!s.ram.every(n=>integer(n,0,255))||
        !Array.isArray(c.r)||c.r.length!==8||!c.r.every(n=>integer(n,0,255))||
        !integer(c.pc,0,65535)||!integer(c.sp,0,65535)||!integer(c.f,0,255)||!integer(c.cycles,0,Number.MAX_SAFE_INTEGER)||
        typeof c.halted!=='boolean'||typeof c.interrupts!=='boolean'||!['portA','portC','control'].every(k=>integer(s[k],0,255))||
        !Number.isFinite(s.targetCycles)||s.targetCycles<0||s.targetCycles>Number.MAX_SAFE_INTEGER||
        (value.state!=='over'&&(s.targetCycles>c.cycles||s.targetCycles<c.cycles-32))||
        !integer(value.ticks,0,Number.MAX_SAFE_INTEGER)||!integer(value.startedAt,0,c.cycles))return null;
      const game=new ManicGame();game.machine.restore(s);game.ticks=value.ticks;game.startedAt=value.startedAt;game.introFinished=value.introFinished;game.state=value.state==='playing'?'paused':value.state;return game;
    }
  }
  globalThis.ManicGame=ManicGame;
})();
