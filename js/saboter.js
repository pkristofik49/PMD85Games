/* SABO +4 executes its original mission, movement, combat and PIO sound. */
(() => {
  const SAVE_VERSION=1,END_WAIT=0x26ac;
  class SaboterMachine extends Pmd85 {
    key(direction,pressed){if(direction==='action'){if(pressed)this.columns[10]|=16;else this.columns[10]&=~16;return;}const key={up:[2,4],down:[1,16],left:[12,4],right:[14,4]}[direction];if(!key)return;const [column,mask]=key;if(pressed)this.columns[column]|=mask;else this.columns[column]&=~mask;}
    boot(){this.cpu.pc=0x8000;this.until(0x84a1);this.memory.set(SaboterNativeData.program);this.cpu.sp=0x7ff0;this.cpu.pc=0x7189;this.until(0x25a1,16000000);this.result=null;this.edges=[];this.targetCycles=this.cpu.cycles;}
    start(){this.release();this.columns[9]=1;this.until(0x266b);this.release();this.until(0x254b);this.columns[9]=1;this.until(0x2677);this.release();this.until(0x72c0,16000000);this.edges=[];this.targetCycles=this.cpu.cycles;}
    advance(cycles){this.targetCycles=(this.targetCycles??this.cpu.cycles)+cycles;while(this.cpu.cycles<this.targetCycles&&!(this.result!==null&&this.cpu.pc===END_WAIT)){if(this.cpu.pc===0x267a){this.result=this.cpu.r[7];this.release();}this.cpu.step();}}
  }

  class SaboterGame {
    constructor(){this.machine=new SaboterMachine();this.machine.boot();this.state='ready';this.events=[];this.ticks=0;this.startedAt=this.machine.cpu.cycles;}
    get energy(){return this.machine.memory[0x7253];}
    get lives(){return this.energy;}
    start(){if(this.state==='ready'){this.events=[];this.machine.start();this.state='playing';}}
    turn(direction,pressed=true){if(this.state==='playing'&&this.machine.result===null)this.machine.key(direction,pressed);}
    release(){this.machine.release();}
    takeEvents(){return this.events.splice(0);}
    advance(milliseconds){
      if(!['ready','playing'].includes(this.state)||!Number.isFinite(milliseconds)||milliseconds<=0)return;
      const start=this.machine.cpu.cycles,control=this.machine.portC&7;
      this.machine.advance(milliseconds*Pmd85.CLOCK/1000);this.ticks++;
      this.events.push({start,end:this.machine.cpu.cycles,control,edges:this.machine.edges.splice(0)});
      if(this.machine.result!==null&&this.machine.cpu.pc===END_WAIT){this.state=this.machine.result===6?'won':'over';this.release();}
    }
    snapshot(){return{game:'saboter',version:SAVE_VERSION,state:this.state,result:this.machine.result,ticks:this.ticks,startedAt:this.startedAt,machine:this.machine.snapshot()};}
    static restore(value){
      if(!value||value.game!=='saboter'||value.version!==SAVE_VERSION||!['ready','playing','paused','over','won'].includes(value.state)||(value.result!==null&&![6,10,11,12].includes(value.result)))return null;
      const integer=(n,lo,hi)=>Number.isInteger(n)&&n>=lo&&n<=hi,s=value.machine,c=s?.cpu;
      if(!s||!c||!Array.isArray(s.ram)||s.ram.length!==49152||!s.ram.every(n=>integer(n,0,255))||
        !Array.isArray(c.r)||c.r.length!==8||!c.r.every(n=>integer(n,0,255))||
        !integer(c.pc,0,65535)||!integer(c.sp,0,65535)||!integer(c.f,0,255)||!integer(c.cycles,0,Number.MAX_SAFE_INTEGER)||
        typeof c.halted!=='boolean'||typeof c.interrupts!=='boolean'||!['portA','portC','control'].every(k=>integer(s[k],0,255))||
        !Number.isFinite(s.targetCycles)||s.targetCycles<0||s.targetCycles>Number.MAX_SAFE_INTEGER||
        (!['over','won'].includes(value.state)&&(s.targetCycles>c.cycles||s.targetCycles<c.cycles-32))||
        !integer(value.ticks,0,Number.MAX_SAFE_INTEGER)||!integer(value.startedAt,0,c.cycles))return null;
      const game=new SaboterGame();game.machine.restore(s);game.ticks=value.ticks;game.startedAt=value.startedAt;game.machine.result=value.result;game.state=value.state==='playing'?'paused':value.state;return game;
    }
  }
  globalThis.SaboterGame=SaboterGame;
})();
