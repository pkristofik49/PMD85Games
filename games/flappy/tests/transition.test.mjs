import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LevelTransition,BLINK_MS,COVER_MS,HOLD_MS,REVEAL_MS} from '../src/transition.js';
import {WIDTH,HEIGHT} from '../src/engine.js';

test('Flappy blinks before a single brick covers the room',()=>{
 const transition=new LevelTransition();
 assert.equal(transition.phase,'blink');assert.equal(transition.playerVisible,true);
 transition.advance(180);assert.equal(transition.playerVisible,false);assert.equal(transition.coveredCells,0);
 transition.advance(180);assert.equal(transition.playerVisible,true);assert.equal(transition.coveredCells,0);
 transition.advance(BLINK_MS-360);assert.equal(transition.phase,'cover');assert.equal(transition.coveredCells,0);
});
test('The old room fills completely before the new room is revealed',()=>{
 const transition=new LevelTransition();
 transition.advance(BLINK_MS+COVER_MS/2);
 assert.equal(transition.coveredCells,WIDTH*HEIGHT/2);assert.equal(transition.firstCoveredCell,0);
 const covered=transition.advance(COVER_MS/2);
 assert.equal(covered.loadNext,true);assert.equal(transition.phase,'hold');assert.equal(transition.coveredCells,WIDTH*HEIGHT);
 transition.advance(HOLD_MS/2);assert.equal(transition.phase,'hold');assert.equal(transition.coveredCells,WIDTH*HEIGHT);
 transition.advance(HOLD_MS/2+REVEAL_MS/2);
 assert.equal(transition.phase,'reveal');assert.equal(transition.firstCoveredCell,WIDTH*HEIGHT/2);assert.equal(transition.coveredCells,WIDTH*HEIGHT/2);
 assert.equal(transition.advance(REVEAL_MS/2).finished,true);assert.equal(transition.coveredCells,0);
});
test('The next scene is requested once even when a frame crosses phase boundaries',()=>{
 const transition=new LevelTransition();let loads=0;
 for(let i=0;i<100;i++)if(transition.advance(97).loadNext)loads++;
 assert.equal(loads,1);assert.equal(transition.phase,'done');
 const skipped=new LevelTransition();assert.equal(skipped.advance(10000).loadNext,true);assert.equal(skipped.advance(10000).loadNext,false);
});
test('Brick masks always stay inside the board and a paused transition stays unchanged',()=>{
 const transition=new LevelTransition();
 for(let i=0;i<200;i++){
  transition.advance(17);
  assert.ok(transition.firstCoveredCell>=0);assert.ok(transition.coveredCells>=0);
  assert.ok(transition.firstCoveredCell+transition.coveredCells<=WIDTH*HEIGHT);
  const snapshot=JSON.stringify(transition);transition.advance(0);assert.equal(JSON.stringify(transition),snapshot);
 }
});
test('Finishing scene 200 blinks and ends without trying to load scene 201',()=>{
 const transition=new LevelTransition({final:true});
 const result=transition.advance(BLINK_MS);assert.equal(result.loadNext,false);assert.equal(result.finished,true);
 assert.equal(transition.phase,'done');assert.equal(transition.coveredCells,0);
});
