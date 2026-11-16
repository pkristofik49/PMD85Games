/* PCM comes from the original program's PIO writes and PMD divider phase. */
(() => {
  function pcm(chunk,rate){
    const clock=2048000,first=Math.ceil(chunk.start*rate/clock),last=Math.ceil(chunk.end*rate/clock);
    const samples=new Float32Array(Math.max(0,last-first));let control=chunk.control,edge=0;
    for(let i=0;i<samples.length;i++){
      const cycle=(first+i)*clock/rate;
      while(edge<chunk.edges.length&&chunk.edges[edge][0]<=cycle)control=chunk.edges[edge++][1];
      const high=(control&4)||((control&2)&&(Math.floor(cycle/256)&1))||((control&1)&&(Math.floor(cycle/1024)&1));
      samples[i]=high?.12:0;
    }
    return{samples,first};
  }
  class Audio {
    constructor(){this.context=null;this.nodes=new Set();this.enabled=false;this.baseSample=null;this.baseTime=0;}
    unlock(){if(!this.enabled)return;try{this.context??=new (window.AudioContext||window.webkitAudioContext)();void this.context.resume().catch(()=>{});}catch{}}
    stop(){for(const node of this.nodes){try{node.stop();}catch{}}this.nodes.clear();this.baseSample=null;}
    play(chunk){
      if(!this.enabled||!this.context||this.context.state!=='running'||!chunk||chunk.end<=chunk.start)return;
      const rate=this.context.sampleRate,{samples,first}=pcm(chunk,rate);if(!samples.length)return;
      const now=this.context.currentTime;
      if(this.baseSample===null||this.baseTime+(first-this.baseSample)/rate<now){this.baseSample=first;this.baseTime=now+.045;}
      const buffer=this.context.createBuffer(1,samples.length,rate);buffer.copyToChannel(samples,0);
      const source=this.context.createBufferSource();source.buffer=buffer;source.connect(this.context.destination);
      this.nodes.add(source);source.onended=()=>{this.nodes.delete(source);source.disconnect();};
      source.start(this.baseTime+(first-this.baseSample)/rate);
    }
  }
  globalThis.PmdAudio=Audio;globalThis.PmdPCM=pcm;
})();
