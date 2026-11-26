/* MANIC2+3 runs its original interconnected rooms, input, training and sound. */
(() => {
  const SAVE_VERSION=1,GAME_OVER=0x17f0,VICTORY=0x23e8;
  class Manic2Machine extends Pmd85 {
    input(port){const value=super.input(port);return(port&0x8f)===0x85&&this.jump?value&~0x20:value;}
    key(direction,pressed){if(direction==='action'||direction==='up'){this.jump=pressed;return;}const column={left:12,right:14}[direction];if(column===undefined)return;if(pressed)this.columns[column]|=4;else this.columns[column]&=~4;}
    release(){super.release();this.jump=false;}
    boot(){this.cpu.pc=0x8000;this.until(0x84a1);this.memory.set(Manic2NativeData.program);this.cpu.sp=0x7ffb;this.cpu.pc=0x0230;this.until(0x0238);this.edges=[];this.targetCycles=this.cpu.cycles;}
    start(training){
      this.release();this.columns[14]=16;this.until(GAME_OVER);this.release();this.until(0x18e3,32000000);
      this.columns[training?4:14]=training?4:16;this.until(0x18f0);this.release();this.until(0x1901);
      this.edges=[];this.targetCycles=this.cpu.cycles;
    }
    advance(cycles,{stopAt=null}={}){this.targetCycles=(this.targetCycles??this.cpu.cycles)+cycles;while(this.cpu.cycles<this.targetCycles&&this.cpu.pc!==stopAt&&this.cpu.pc!==VICTORY)this.cpu.step();}
  }
  class Manic2Game {
    constructor(){this.machine=new Manic2Machine();this.machine.boot();this.state='ready';this.training=false;this.introFinished=false;this.events=[];this.ticks=0;this.startedAt=this.machine.cpu.cycles;}
    get level(){return this.machine.memory[0x1d38];}
    get keys(){const m=this.machine.memory;return m[0x201b]+10*m[0x201c]+100*m[0x201d];}
    get lives(){return this.state==='over'?0:this.machine.memory[0x2196]+1;}
    start(){if(this.state==='ready'){this.events=[];this.machine.start(this.training);this.introFinished=true;this.state='playing';}}
    turn(direction,pressed=true){if(this.state==='playing')this.machine.key(direction,pressed);}
    release(){this.machine.release();}
    takeEvents(){return this.events.splice(0);}
    advance(milliseconds){
      const intro=this.state==='ready'&&!this.introFinished;
      if((this.state!=='playing'&&!intro)||!Number.isFinite(milliseconds)||milliseconds<=0)return;
      const start=this.machine.cpu.cycles,control=this.machine.portC&7;
      this.machine.advance(milliseconds*Pmd85.CLOCK/1000,{stopAt:GAME_OVER});this.ticks++;
      this.events.push({start,end:this.machine.cpu.cycles,control,edges:this.machine.edges.splice(0)});
      if(intro&&this.machine.cpu.pc===GAME_OVER){this.introFinished=true;this.machine.targetCycles=this.machine.cpu.cycles;}
      else if(!intro&&this.machine.cpu.pc===GAME_OVER){this.state='over';this.release();}
      else if(!intro&&this.machine.cpu.pc===VICTORY){this.state='won';this.release();}
    }
    snapshot(){return{game:'manic2',version:SAVE_VERSION,state:this.state,training:this.training,introFinished:this.introFinished,ticks:this.ticks,startedAt:this.startedAt,machine:this.machine.snapshot()};}
    static restore(value){
      if(!value||value.game!=='manic2'||value.version!==SAVE_VERSION||!['ready','playing','paused','over','won'].includes(value.state)||typeof value.training!=='boolean'||typeof value.introFinished!=='boolean')return null;
      const integer=(n,lo,hi)=>Number.isInteger(n)&&n>=lo&&n<=hi,s=value.machine,c=s?.cpu;
      if(!s||!c||!Array.isArray(s.ram)||s.ram.length!==49152||!s.ram.every(n=>integer(n,0,255))||
        !Array.isArray(c.r)||c.r.length!==8||!c.r.every(n=>integer(n,0,255))||
        !integer(c.pc,0,65535)||!integer(c.sp,0,65535)||!integer(c.f,0,255)||!integer(c.cycles,0,Number.MAX_SAFE_INTEGER)||
        typeof c.halted!=='boolean'||typeof c.interrupts!=='boolean'||!['portA','portC','control'].every(k=>integer(s[k],0,255))||
        !Number.isFinite(s.targetCycles)||s.targetCycles<0||s.targetCycles>Number.MAX_SAFE_INTEGER||
        (!['over','won'].includes(value.state)&&(s.targetCycles>c.cycles||s.targetCycles<c.cycles-32))||
        !integer(value.ticks,0,Number.MAX_SAFE_INTEGER)||!integer(value.startedAt,0,c.cycles))return null;
      const game=new Manic2Game();game.machine.restore(s);game.ticks=value.ticks;game.startedAt=value.startedAt;game.training=value.training;game.introFinished=value.introFinished;game.state=value.state==='playing'?'paused':value.state;return game;
    }
  }
  globalThis.Manic2Game=Manic2Game;
})();
