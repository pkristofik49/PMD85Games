import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GameAudio,effects,loadSound,SOUND_KEY} from '../src/audio.js';
function fakeContext(){
 const ctx={state:'running',currentTime:0,destination:{},oscillators:[],gains:[],resume:async()=>{},close:async()=>{}};
 const parameter=()=>({events:[],setValueAtTime(...args){this.events.push(args)},exponentialRampToValueAtTime(...args){this.events.push(args)},linearRampToValueAtTime(...args){this.events.push(args)},cancelScheduledValues(){}});
 ctx.createOscillator=()=>{const osc={frequency:parameter(),connect(){},disconnect(){},start(){this.started=true},stop(){this.stopped=true}};ctx.oscillators.push(osc);return osc};
 ctx.createGain=()=>{const gain={gain:parameter(),connect(){},disconnect(){}};ctx.gains.push(gain);return gain};
 return ctx;
}
test('Muted sounds never initialize or schedule browser audio',async()=>{
 let created=0;const audio=new GameAudio({createContext(){created++;return fakeContext()}});
 assert.equal(await audio.play('step'),false);assert.equal(created,0);
 audio.setEnabled(true);assert.equal(created,0,'Restoring sound-on must wait for user interaction');
 assert.equal(await audio.play('missing'),false);assert.equal(created,0);
});
test('Every effect schedules finite, audible square waves on one reused context',async()=>{
 const ctx=fakeContext();let created=0;
 const audio=new GameAudio({createContext(){created++;return ctx}});audio.setEnabled(true);
 for(const [event,notes]of Object.entries(effects)){
  const before=ctx.oscillators.length;assert.equal(await audio.play(event),true,event);
  assert.equal(ctx.oscillators.length-before,notes.length,event);
  for(const [offset,duration,from,to,volume]of notes)assert.ok(offset>=0&&duration>0&&from>0&&to>0&&volume>0&&volume<1,event);
 }
 assert.equal(created,1);assert.ok(ctx.oscillators.every(osc=>osc.type==='square'&&osc.started&&osc.stopped));
});
test('Muting stops active and scheduled notes immediately',async()=>{
 const ctx=fakeContext(),audio=new GameAudio({createContext:()=>ctx});audio.setEnabled(true);await audio.play('win');
 assert.ok(audio.voices.size>0);audio.setEnabled(false);assert.equal(audio.voices.size,0);
 assert.equal(await audio.play('win'),false);
 for(const gain of ctx.gains)assert.deepEqual(gain.gain.events.at(-1),[0,0]);
});
test('A blocked audio context or absent audio API does not break the game',async()=>{
 for(const createContext of [()=>null,()=>{throw Error('Not available')},()=>({...fakeContext(),state:'suspended',resume:async()=>{throw Error('Blocked')}})]){
  const audio=new GameAudio({createContext});audio.setEnabled(true);assert.equal(await audio.play('start'),false);audio.close();
 }
});
test('Sound preference can be restored without requiring browser storage',()=>{
 assert.equal(loadSound({getItem(key){assert.equal(key,SOUND_KEY);return 'true'}}),true);
 assert.equal(loadSound({getItem:()=>null}),false);
 assert.equal(loadSound({getItem(){throw Error('Storage blocked')}}),false);
});
