/* Original INVADERS code controls motion, waves, shots, score and PIO audio. */
(() => {
  const SAVE_VERSION=1,GAME_OVER=0x0389,MENU=0x05fd;
  class InvadersMachine extends Pmd85 {
    key(direction,pressed){const key={left:[12,4],right:[14,4],action:[0,4]}[direction];if(!key)return;const [column,mask]=key;if(pressed)this.columns[column]|=mask;else this.columns[column]&=~mask;}
    boot(){this.cpu.pc=0x8000;this.until(0x84a1);this.memory.set(InvadersNativeData.program,InvadersNativeData.address);this.cpu.sp=0x7ff0;this.cpu.pc=0x0100;this.until(MENU);this.edges=[];this.targetCycles=this.cpu.cycles;}
    start(difficulty){this.release();this.columns[difficulty===0?9:difficulty-1]=2;this.until(0x84d9);this.release();this.until(0x060a);this.until(0x02eb);this.edges=[];this.targetCycles=this.cpu.cycles;}
    restart(difficulty){this.release();this.cpu.sp=0x7ff0;this.cpu.pc=0x02e5;this.until(MENU);this.start(difficulty);}
    advance(cycles){this.targetCycles=(this.targetCycles??this.cpu.cycles)+cycles;while(this.cpu.cycles<this.targetCycles&&this.cpu.pc!==GAME_OVER&&this.cpu.pc!==MENU)this.cpu.step();}
  }
  class InvadersGame {
    constructor(){this.machine=new InvadersMachine();this.machine.boot();this.state='ready';this.difficulty=0;this.events=[];this.ticks=0;this.startedAt=this.machine.cpu.cycles;}
    numberAt(address){const n=this.machine.word(address);return(n&15)+10*(n>>4&15)+100*(n>>8&15)+1000*(n>>12&15);}
    get score(){return this.numberAt(0x03bd);}
    get highScore(){return this.numberAt(0x03bf);}
    get lives(){return this.machine.memory[0x03c9];}
    start(){if(this.state==='ready'||this.state==='level'){this.machine.start(this.difficulty);this.events=[];this.state='playing';}}
    continue(){if(this.state==='level')this.start();}
    restart(){this.machine.restart(this.difficulty);this.events=[];this.state='playing';}
    turn(direction,pressed=true){if(this.state==='playing')this.machine.key(direction,pressed);}
    release(){this.machine.release();}
    takeEvents(){return this.events.splice(0);}
    advance(milliseconds){
      if(this.state!=='playing'||!Number.isFinite(milliseconds)||milliseconds<=0)return;
      const start=this.machine.cpu.cycles,control=this.machine.portC&7;
      this.machine.advance(milliseconds*Pmd85.CLOCK/1000);this.ticks++;
      this.events.push({start,end:this.machine.cpu.cycles,control,edges:this.machine.edges.splice(0)});
      if(this.machine.cpu.pc===GAME_OVER){this.state='over';this.release();}else if(this.machine.cpu.pc===MENU){this.state='level';this.release();}
    }
    snapshot(){return{game:'invaders',version:SAVE_VERSION,state:this.state,difficulty:this.difficulty,ticks:this.ticks,startedAt:this.startedAt,machine:this.machine.snapshot()};}
    static restore(value){
      if(!value||value.game!=='invaders'||value.version!==SAVE_VERSION||!['ready','playing','paused','over','level'].includes(value.state)||!Number.isInteger(value.difficulty)||value.difficulty<0||value.difficulty>4)return null;
      const integer=(n,lo,hi)=>Number.isInteger(n)&&n>=lo&&n<=hi,s=value.machine,c=s?.cpu;
      if(!s||!c||!Array.isArray(s.ram)||s.ram.length!==49152||!s.ram.every(n=>integer(n,0,255))||
        !Array.isArray(c.r)||c.r.length!==8||!c.r.every(n=>integer(n,0,255))||
        !integer(c.pc,0,65535)||!integer(c.sp,0,65535)||!integer(c.f,0,255)||!integer(c.cycles,0,Number.MAX_SAFE_INTEGER)||
        typeof c.halted!=='boolean'||typeof c.interrupts!=='boolean'||!['portA','portC','control'].every(k=>integer(s[k],0,255))||
        !Number.isFinite(s.targetCycles)||s.targetCycles<0||s.targetCycles>Number.MAX_SAFE_INTEGER||
        (!['over','level'].includes(value.state)&&(s.targetCycles>c.cycles||s.targetCycles<c.cycles-32))||
        !integer(value.ticks,0,Number.MAX_SAFE_INTEGER)||!integer(value.startedAt,0,c.cycles))return null;
      const game=new InvadersGame();game.machine.restore(s);game.ticks=value.ticks;game.startedAt=value.startedAt;game.difficulty=value.difficulty;game.state=value.state==='playing'?'paused':value.state;return game;
    }
  }
  globalThis.InvadersGame=InvadersGame;
})();
