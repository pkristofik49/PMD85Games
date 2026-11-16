/* Intel 8080 execution, including PMD 85-1 video arbitration.
 * The PMD duration table is derived from ChipCpu8080P by Roman Borik (MIT).
 * See vendor/LICENSE.pmd-timing for the retained notice and SOURCES.md.
 */
(() => {
  const flags=Uint8Array.from({length:256},(_,n)=>{let p=n;p^=p>>4;p^=p>>2;p^=p>>1;return(n&128)|(n===0?64:0)|((p&1)?0:4)|2;});
  // PMD machine-cycle durations include its video processor's wait states.
  const pmd=[
    4,11,8,5,5,5,7,4,4,10,7,5,5,5,7,4,
    4,11,8,5,5,5,7,4,4,10,7,5,5,5,7,4,
    4,11,18,5,5,5,7,4,4,10,19,5,5,5,7,4,
    4,11,14,5,10,10,10,4,4,10,15,5,5,5,7,4,
    ...Array.from({length:3},()=>[5,5,5,5,5,5,7,5,5,5,5,5,5,5,7,5]).flat(),
    8,8,8,8,8,8,5,8,5,5,5,5,5,5,7,5,
    ...Array.from({length:4},()=>[4,4,4,4,4,4,7,4,4,4,4,4,4,4,7,4]).flat(),
    5,11,11,11,13,12,7,12,5,11,11,11,13,20,7,12,
    5,11,11,10,13,12,7,12,5,11,11,11,13,20,7,12,
    5,11,11,20,13,12,7,12,5,5,11,4,13,20,7,12,
    5,11,11,4,13,12,7,12,5,5,11,4,13,20,7,12
  ];
  class Intel8080 {
    constructor(memory=new Uint8Array(65536),{pmdTiming=false,read,write,input,output}={}){
      this.m=memory;this.r=new Uint8Array(8);this.pc=0;this.sp=0;this.f=2;this.cycles=0;this.halted=false;this.interrupts=false;
      this.pmdTiming=pmdTiming;this.read=read??(a=>this.m[a&65535]);this.write=write??((a,v)=>{this.m[a&65535]=v;});
      this.input=input??(()=>255);this.output=output??(()=>{});
    }
    pair(n){return n===3?this.sp:(this.r[n*2]<<8)|this.r[n*2+1];}
    setPair(n,v){v&=65535;if(n===3)this.sp=v;else{this.r[n*2]=v>>8;this.r[n*2+1]=v&255;}}
    reg(n){return n===6?this.read(this.pair(2)):this.r[n];}
    setReg(n,v){v&=255;if(n===6)this.write(this.pair(2),v);else this.r[n]=v;}
    byte(){const v=this.read(this.pc);this.pc=(this.pc+1)&65535;return v;}
    word(){const lo=this.byte();return lo|(this.byte()<<8);}
    push(v){this.sp=(this.sp-1)&65535;this.write(this.sp,v>>8);this.sp=(this.sp-1)&65535;this.write(this.sp,v&255);}
    pop(){const lo=this.read(this.sp);this.sp=(this.sp+1)&65535;const hi=this.read(this.sp);this.sp=(this.sp+1)&65535;return lo|(hi<<8);}
    condition(n){const f=this.f;return [!(f&64),!!(f&64),!(f&1),!!(f&1),!(f&4),!!(f&4),!(f&128),!!(f&128)][n];}
    alu(op,v){
      const a=this.r[7],carry=this.f&1;let result,ac=0,cy=0;
      if(op<4||op===7){
        const subtract=op===2||op===3||op===7,c=(op===1||op===3)?carry:0;
        result=subtract?a-v-c:a+v+c;cy=(subtract?result<0:result>255)?1:0;
        ac=(subtract?~(a^v^result):(a^v^result))&16;
      }else if(op===4){result=a&v;ac=((a|v)&8)?16:0;}
      else if(op===5)result=a^v;else result=a|v;
      this.f=flags[result&255]|ac|cy;if(op!==7)this.r[7]=result&255;
    }
    step(){
      if(this.halted){const t=this.pmdTiming?4+(this.cycles&1):4;this.cycles+=t;return t;}
      const o=this.byte(),d=(o>>3)&7,s=o&7;let duration=4,taken=false;
      if(o>=0x40&&o<0x80){if(o===0x76){this.halted=true;duration=7;}else{this.setReg(d,this.reg(s));duration=(d===6||s===6)?7:5;}}
      else if(o>=0x80&&o<0xc0){this.alu(d,this.reg(s));duration=s===6?7:4;}
      else if((o&0xc7)===0x06){this.setReg(d,this.byte());duration=d===6?10:7;}
      else if((o&0xc7)===0x04||(o&0xc7)===0x05){const old=this.reg(d),dec=(o&1)!==0,v=(old+(dec?-1:1))&255;this.setReg(d,v);this.f=flags[v]|(this.f&1)|(dec?((old&15)!==0?16:0):((old&15)===15?16:0));duration=d===6?10:5;}
      else if((o&0xcf)===0x01){this.setPair(o>>4,this.word());duration=10;}
      else if((o&0xcf)===0x03){this.setPair(o>>4,this.pair(o>>4)+1);duration=5;}
      else if((o&0xcf)===0x0b){this.setPair(o>>4,this.pair(o>>4)-1);duration=5;}
      else if((o&0xcf)===0x09){const v=this.pair(2)+this.pair(o>>4);this.setPair(2,v);this.f=(this.f&~1)|(v>65535?1:0);duration=10;}
      else if((o&0xc7)===0xc0){taken=this.condition(d);if(taken)this.pc=this.pop();duration=taken?11:5;}
      else if((o&0xc7)===0xc2){const dest=this.word();if(this.condition(d))this.pc=dest;duration=10;}
      else if((o&0xc7)===0xc4){const dest=this.word();taken=this.condition(d);if(taken){this.push(this.pc);this.pc=dest;}duration=taken?17:11;}
      else if((o&0xcf)===0xc1){const v=this.pop(),n=(o>>4)&3;if(n===3){this.r[7]=v>>8;this.f=(v&0xd5)|2;}else this.setPair(n,v);duration=10;}
      else if((o&0xcf)===0xc5){const n=(o>>4)&3;this.push(n===3?(this.r[7]<<8)|this.f:this.pair(n));duration=11;}
      else if((o&0xc7)===0xc6){this.alu(d,this.byte());duration=7;}
      else if((o&0xc7)===0xc7){this.push(this.pc);this.pc=o&0x38;duration=11;}
      else switch(o){
        case 0x00:case 0x08:case 0x10:case 0x18:case 0x20:case 0x28:case 0x30:case 0x38:break;
        case 0x02:case 0x12:this.write(this.pair(o>>4),this.r[7]);duration=7;break;
        case 0x0a:case 0x1a:this.r[7]=this.read(this.pair(o>>4));duration=7;break;
        case 0x07:{const a=this.r[7];this.r[7]=((a<<1)|(a>>7))&255;this.f=(this.f&~1)|(a>>7);break;}
        case 0x0f:{const a=this.r[7];this.r[7]=(a>>1)|((a&1)<<7);this.f=(this.f&~1)|(a&1);break;}
        case 0x17:{const a=this.r[7];this.r[7]=((a<<1)|(this.f&1))&255;this.f=(this.f&~1)|(a>>7);break;}
        case 0x1f:{const a=this.r[7];this.r[7]=(a>>1)|((this.f&1)<<7);this.f=(this.f&~1)|(a&1);break;}
        case 0x22:{const a=this.word(),v=this.pair(2);this.write(a,v&255);this.write((a+1)&65535,v>>8);duration=16;break;}
        case 0x2a:{const a=this.word();this.setPair(2,this.read(a)|(this.read((a+1)&65535)<<8));duration=16;break;}
        case 0x32:this.write(this.word(),this.r[7]);duration=13;break;
        case 0x3a:this.r[7]=this.read(this.word());duration=13;break;
        case 0x27:{let adjust=0;const a=this.r[7],carry=this.f&1;if((a&15)>9||(this.f&16))adjust|=6;if(a>0x99||carry)adjust|=0x60;this.alu(0,adjust);this.f=(this.f&~1)|((a>0x99||carry)?1:0);break;}
        case 0x2f:this.r[7]^=255;break;
        case 0x37:this.f|=1;break;case 0x3f:this.f^=1;break;
        case 0xc3:case 0xcb:this.pc=this.word();duration=10;break;
        case 0xc9:case 0xd9:this.pc=this.pop();duration=10;break;
        case 0xcd:case 0xdd:case 0xed:case 0xfd:{const dest=this.word();this.push(this.pc);this.pc=dest;duration=17;break;}
        case 0xd3:this.output(this.byte(),this.r[7],this.cycles);duration=10;break;
        case 0xdb:this.r[7]=this.input(this.byte(),this.cycles)&255;duration=10;break;
        case 0xe3:{const lo=this.read(this.sp),hi=this.read((this.sp+1)&65535);this.write(this.sp,this.r[5]);this.write((this.sp+1)&65535,this.r[4]);this.r[4]=hi;this.r[5]=lo;duration=18;break;}
        case 0xe9:this.pc=this.pair(2);duration=5;break;
        case 0xeb:{const v=this.pair(2);this.setPair(2,this.pair(1));this.setPair(1,v);break;}
        case 0xf3:this.interrupts=false;break;case 0xfb:this.interrupts=true;break;
        case 0xf9:this.sp=this.pair(2);duration=5;break;
        default:throw Error('Unsupported 8080 opcode '+o.toString(16));
      }
      if(this.pmdTiming)duration=(taken?((o&0xc7)===0xc0?13:20):pmd[o])+(this.cycles&1);
      this.cycles+=duration;return duration;
    }
    snapshot(){return{r:[...this.r],pc:this.pc,sp:this.sp,f:this.f,cycles:this.cycles,halted:this.halted,interrupts:this.interrupts};}
    restore(s){this.r.set(s.r);for(const k of ['pc','sp','f','cycles','halted','interrupts'])this[k]=s[k];}
  }
  globalThis.Intel8080=Intel8080;
})();
