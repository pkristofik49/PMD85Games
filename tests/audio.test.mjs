import test from 'node:test';import assert from 'node:assert/strict';import '../js/audio.js';
test('PMD 4 kHz and 1 kHz divider gates derive from absolute clock phase',()=>{
 for(const [control,frequency]of [[2,4000],[1,1000]]){
  const {samples}=PmdPCM({start:0,end:2048000,control,edges:[]},48000);
  let rises=0;for(let i=1;i<samples.length;i++)if(samples[i]>samples[i-1])rises++;
  assert.equal(rises,frequency);
 }
});
test('Native OUT transitions control the gate; there are no invented note events',()=>{
 const {samples}=PmdPCM({start:0,end:20480,control:0,edges:[[2048,4],[4096,0]]},48000);
 assert.equal(samples[47],0);assert.ok(samples[48]>0);assert.ok(samples[95]>0);assert.equal(samples[96],0);
});
test('PCM is independent of animation frame partitioning',()=>{
 const whole={start:201,end:21451,control:0,edges:[[311,2],[18901,0]]};
 const a=PmdPCM(whole,44100).samples;
 const b=PmdPCM({...whole,end:10001,edges:[[311,2]]},44100).samples;
 const c=PmdPCM({...whole,start:10001,control:2,edges:[[18901,0]]},44100).samples;
 assert.deepEqual([...b,...c],[...a]);
});
