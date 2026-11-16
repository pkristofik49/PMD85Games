// One-bit-style square-wave effects, recreated with native Web Audio.
// These are new effect sequences, not sampled recordings of the PMD program.
export const SOUND_KEY='flappy.sound';
export const effects={
  step:[[0,.025,230,170,.07]],
  push:[[0,.08,140,80,.1]],
  break:[[0,.035,520,300,.13],[.035,.04,270,120,.12],[.075,.07,120,60,.1]],
  collect:[[0,.055,660,660,.1],[.055,.055,880,880,.1],[.11,.08,1320,1320,.09]],
  fire:[[0,.12,1100,180,.12]],
  sleep:[[0,.06,440,350,.1],[.06,.06,330,260,.1],[.12,.09,220,170,.09]],
  impact:[[0,.065,150,60,.1]],
  crush:[[0,.045,250,100,.12],[.045,.07,100,50,.1]],
  win:[[0,.1,523.25,523.25,.11],[.1,.1,659.25,659.25,.11],[.2,.1,783.99,783.99,.11],[.3,.22,1046.5,1046.5,.1]],
  dead:[[0,.12,440,330,.12],[.12,.12,330,220,.11],[.24,.28,220,65,.1]],
  start:[[0,.06,392,392,.09],[.07,.12,523.25,523.25,.09]]
};
export function loadSound(storage){
  try{return (storage??globalThis.localStorage).getItem(SOUND_KEY)==='true'}catch{return false}
}
export class GameAudio{
  constructor({createContext}={}){
    this.createContext=createContext??(()=>{const Audio=globalThis.AudioContext??globalThis.webkitAudioContext;return Audio?new Audio():null});
    this.enabled=false;this.context=null;this.voices=new Set();
  }
  setEnabled(value){this.enabled=Boolean(value);if(!this.enabled)this.stop()}
  async unlock(){
    if(!this.enabled)return false;
    try{
      this.context??=this.createContext();
      if(!this.context)return false;
      if(this.context.state!=='running')await this.context.resume();
      return this.enabled&&this.context.state==='running';
    }catch{return false}
  }
  async play(event){
    const sequence=effects[event];
    if(!sequence||!await this.unlock())return false;
    if(event==='dead'||event==='win')this.stop();
    const ctx=this.context,now=ctx.currentTime;
    for(const [offset,duration,from,to,volume]of sequence){
      const osc=ctx.createOscillator(),gain=ctx.createGain();
      const start=now+offset,end=start+duration;
      osc.type='square';osc.frequency.setValueAtTime(from,start);
      osc.frequency.exponentialRampToValueAtTime(to,end);
      gain.gain.setValueAtTime(.0001,start);
      gain.gain.linearRampToValueAtTime(volume*.2,start+.003);
      gain.gain.exponentialRampToValueAtTime(.0001,end);
      osc.connect(gain);gain.connect(ctx.destination);
      const voice={osc,gain};this.voices.add(voice);
      osc.onended=()=>{osc.disconnect();gain.disconnect();this.voices.delete(voice)};
      osc.start(start);osc.stop(end+.005);
    }
    return true;
  }
  stop(){
    for(const {osc,gain}of this.voices){
      try{gain.gain.cancelScheduledValues(0);gain.gain.setValueAtTime(0,this.context.currentTime);osc.stop()}catch{/* Already ended. */}
    }
    this.voices.clear();
  }
  close(){this.enabled=false;this.stop();this.context?.close().catch(()=>{})}
}
