(() => {
  class Audio {
    constructor(){this.context=null;this.nodes=new Set();this.enabled=false;}
    unlock(){if(!this.enabled)return;try{this.context??=new (window.AudioContext||window.webkitAudioContext)();void this.context.resume().catch(()=>{});}catch{}}
    stop(){for(const node of this.nodes){try{node.stop();}catch{}}this.nodes.clear();}
    play(name){
      if(!this.enabled||!this.context||this.context.state!=='running')return;
      const notes={step:[[110,.012]],ring:[[880,.035],[1320,.035]],start:[[330,.07],[440,.07],[660,.12]],
        death:[[660,.08],[440,.08],[220,.13],[110,.2]],level:[[440,.08],[550,.08],[660,.08],[880,.2]]}[name];
      if(!notes)return;let at=this.context.currentTime;
      for(const [frequency,duration]of notes){const oscillator=this.context.createOscillator(),gain=this.context.createGain();
        oscillator.type='square';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(.018,at);
        gain.gain.setValueAtTime(.018,at+duration*.7);gain.gain.linearRampToValueAtTime(0,at+duration);
        oscillator.connect(gain);gain.connect(this.context.destination);this.nodes.add(oscillator);
        oscillator.onended=()=>{this.nodes.delete(oscillator);oscillator.disconnect();gain.disconnect();};
        oscillator.start(at);oscillator.stop(at+duration);at+=duration;
      }
    }
  }
  globalThis.PmdAudio=Audio;
})();
