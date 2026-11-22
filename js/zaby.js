/* Original ZABY MRM code owns platforms, jumps, frog stock, scoring and audio. */
(() => {
  const SAVE_VERSION=1,STOP_GAME_OVER=0x7b65;
  class ZabyMachine extends Pmd85 {
    key(direction,pressed){const column={up:4,action:4,newFrog:9}[direction];if(column===undefined)return;if(pressed)this.columns[column]|=1;else this.columns[column]&=~1;}
    boot(){
      this.cpu.pc=0x8000;this.until(0x84a1);this.memory.set(ZabyNativeData.program,ZabyNativeData.address);
      // MRM Booter convention: model 1 in A, SP=8000h. The file is standalone.
      this.cpu.pc=ZabyNativeData.address;this.cpu.sp=0x8000;this.cpu.r[7]=1;this.until(0x7524);
      this.columns[11]=1;this.until(0x7c99);this.release();this.until(0x7da0);
      this.edges=[];this.targetCycles=this.cpu.cycles;
    }
  }
  class ZabyGame {
    constructor(){this.machine=new ZabyMachine();this.machine.boot();this.state='ready';this.events=[];this.ticks=0;this.startedAt=this.machine.cpu.cycles;}
    get score(){const bcd=this.machine.word(0x7b53);return(bcd>>12)*1000+((bcd>>8)&15)*100+((bcd>>4)&15)*10+(bcd&15);}
    get lives(){const reserve=this.machine.word(0x772d);return this.state==='over'?0:(reserve<256?Math.floor((reserve+3)/5):0)+(this.machine.memory[0x77a0]===255?0:1);}
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
    snapshot(){return{game:'zaby',version:SAVE_VERSION,state:this.state,ticks:this.ticks,startedAt:this.startedAt,machine:this.machine.snapshot()};}
    static restore(value){
      if(!value||value.game!=='zaby'||value.version!==SAVE_VERSION||!['ready','playing','paused','over'].includes(value.state))return null;
      const integer=(n,lo,hi)=>Number.isInteger(n)&&n>=lo&&n<=hi,s=value.machine,c=s?.cpu;
      if(!s||!c||!Array.isArray(s.ram)||s.ram.length!==49152||!s.ram.every(n=>integer(n,0,255))||
        !Array.isArray(c.r)||c.r.length!==8||!c.r.every(n=>integer(n,0,255))||
        !integer(c.pc,0,65535)||!integer(c.sp,0,65535)||!integer(c.f,0,255)||!integer(c.cycles,0,Number.MAX_SAFE_INTEGER)||
        typeof c.halted!=='boolean'||typeof c.interrupts!=='boolean'||!['portA','portC','control'].every(k=>integer(s[k],0,255))||
        !Number.isFinite(s.targetCycles)||s.targetCycles<0||s.targetCycles>Number.MAX_SAFE_INTEGER||
        (value.state!=='over'&&(s.targetCycles>c.cycles||s.targetCycles<c.cycles-32))||
        !integer(value.ticks,0,Number.MAX_SAFE_INTEGER)||!integer(value.startedAt,0,c.cycles))return null;
      const game=new ZabyGame();game.machine.restore(s);game.ticks=value.ticks;game.startedAt=value.startedAt;game.state=value.state==='playing'?'paused':value.state;return game;
    }
  }
  globalThis.ZabyGame=ZabyGame;
})();
