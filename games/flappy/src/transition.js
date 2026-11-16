import {WIDTH,HEIGHT} from './engine.js';
export const BLINK_MS=1080,COVER_MS=720,HOLD_MS=240,REVEAL_MS=720;
const CELLS=WIDTH*HEIGHT;
export class LevelTransition{
  constructor({final=false}={}){this.final=final;this.elapsed=0}
  get phase(){
    if(this.elapsed<BLINK_MS)return 'blink';
    if(this.final)return 'done';
    if(this.elapsed<BLINK_MS+COVER_MS)return 'cover';
    if(this.elapsed<BLINK_MS+COVER_MS+HOLD_MS)return 'hold';
    if(this.elapsed<BLINK_MS+COVER_MS+HOLD_MS+REVEAL_MS)return 'reveal';
    return 'done';
  }
  get progress(){
    if(this.phase==='cover')return (this.elapsed-BLINK_MS)/COVER_MS;
    if(this.phase==='reveal')return (this.elapsed-BLINK_MS-COVER_MS-HOLD_MS)/REVEAL_MS;
    return this.phase==='hold'?1:0;
  }
  get playerVisible(){return this.phase!=='blink'||Math.floor(this.elapsed/180)%2===0}
  get firstCoveredCell(){return this.phase==='reveal'?Math.floor(this.progress*CELLS):0}
  get coveredCells(){
    if(this.phase==='cover')return Math.floor(this.progress*CELLS);
    if(this.phase==='hold')return CELLS;
    if(this.phase==='reveal')return CELLS-this.firstCoveredCell;
    return 0;
  }
  advance(milliseconds){
    const before=this.elapsed;
    const duration=this.final?BLINK_MS:BLINK_MS+COVER_MS+HOLD_MS+REVEAL_MS;
    this.elapsed=Math.min(duration,this.elapsed+Math.max(0,milliseconds));
    return {loadNext:!this.final&&before<BLINK_MS+COVER_MS&&this.elapsed>=BLINK_MS+COVER_MS,finished:this.phase==='done'};
  }
}
