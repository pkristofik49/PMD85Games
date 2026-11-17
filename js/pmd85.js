/* PMD 85-1 devices required by the original Pampuch program. No ROM hooks. */
(() => {
  const CLOCK=2048000;
  const keys={up:[1,4],down:[1,16],left:[12,4],right:[14,4]};
  class Pmd85 {
    constructor(){
      this.memory=new Uint8Array(65536);this.memory.set(PampuchNativeData.monitor,0x8000);
      this.columns=new Uint8Array(16);this.portA=0;this.portC=0;this.control=0x8a;this.edges=[];
      this.cpu=new Intel8080(this.memory,{pmdTiming:true,read:a=>this.read(a),write:(a,v)=>this.write(a,v),input:p=>this.input(p),output:(p,v,t)=>this.output(p,v,t)});
    }
    read(address){address&=65535;if(address>=0xa000&&address<0xb000)return this.memory[address-0x2000];if((address>=0x9000&&address<0xa000)||(address>=0xb000&&address<0xc000))return 255;return this.memory[address];}
    write(address,value){address&=65535;if(address<0x8000||address>=0xc000)this.memory[address]=value&255;}
    input(port){switch(port&0x8f){case 0x84:return this.portA;case 0x85:return (~this.columns[this.portA&15]&31)|0x60;case 0x86:return this.portC;case 0x87:return this.control;default:return 255;}}
    output(port,value,cycle){switch(port&0x8f){
      case 0x84:this.portA=value;break;
      case 0x86:this.setSound(value,cycle);break;
      case 0x87:if(value&128){this.control=value;this.portA=0;this.setSound(0,cycle);}else{const bit=1<<((value>>1)&7);this.setSound(value&1?this.portC|bit:this.portC&~bit,cycle);}break;
    }}
    setSound(value,cycle){if((value&7)!==(this.portC&7))this.edges.push([cycle,value&7]);this.portC=value;}
    key(direction,pressed){const key=keys[direction];if(!key)return;const [column,mask]=key;if(pressed)this.columns[column]|=mask;else this.columns[column]&=~mask;}
    release(){this.columns.fill(0);}
    until(address,limit=4000000){let n=0;while(this.cpu.pc!==address&&n++<limit)this.cpu.step();if(this.cpu.pc!==address)throw Error(`PMD execution did not reach ${address.toString(16)} (PC=${this.cpu.pc.toString(16)})`);}
    boot(map=1){
      this.cpu.pc=0x8000;this.until(0x84a1);
      this.memory.set(PampuchNativeData.program,0x100);
      // Select original default map 1, exactly as the native start menu at 1088h.
      if(!Number.isInteger(map)||map<1||map>11)throw Error('Invalid native map');
      this.memory[0x0122]=map;this.memory[0x0109]=map;
      this.cpu.sp=0x7d7c;this.cpu.pc=0x0103;this.until(0x0191);this.edges=[];this.targetCycles=this.cpu.cycles;
    }
    advance(cycles,{stopAt=null,onLevelComplete=null,onPresentation=null}={}){this.targetCycles=(this.targetCycles??this.cpu.cycles)+cycles;while(this.cpu.cycles<this.targetCycles&&this.cpu.pc!==stopAt){if(onLevelComplete&&this.cpu.pc===0x0796)onLevelComplete(this.memory[0x0c7d]);if(onPresentation&&[0x0191,0x0263,0x0805].includes(this.cpu.pc))onPresentation(this.cpu.pc);this.cpu.step();}}
    word(address){return this.memory[address]|this.memory[address+1]<<8;}
    sample(cycle,control=this.portC&7){return !!((control&4)||((control&2)&&(Math.floor(cycle/256)&1))||((control&1)&&(Math.floor(cycle/1024)&1)));}
    snapshot(){return{cpu:this.cpu.snapshot(),ram:[...this.memory.subarray(0,0x8000),...this.memory.subarray(0xc000)],portA:this.portA,portC:this.portC,control:this.control,targetCycles:this.targetCycles};}
    restore(s){this.cpu.restore(s.cpu);this.memory.set(s.ram.slice(0,0x8000));this.memory.set(s.ram.slice(0x8000),0xc000);this.portA=s.portA;this.portC=s.portC;this.control=s.control;this.targetCycles=s.targetCycles;this.edges=[];this.release();}
  }
  Pmd85.CLOCK=CLOCK;globalThis.Pmd85=Pmd85;
})();
