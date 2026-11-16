import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sectorPasswords} from '../assets/sector-passwords.js';
import {findSectorPassword,availableSectors} from '../src/passwords.js';
test('The original forty passwords cover exactly sectors 1 through 200',()=>{
 assert.equal(sectorPasswords.length,40);assert.equal(new Set(sectorPasswords.map(e=>e.code)).size,40);
 for(const [i,entry]of sectorPasswords.entries()){assert.equal(entry.first,i*5+1);assert.equal(entry.last,i*5+5);assert.equal(entry.code.length,5);assert.equal(findSectorPassword(entry.code),entry)}
});
test('Password matching accepts case and outer whitespace but preserves punctuation',()=>{
 for(const [input,first]of [[' shiba ',1],[':beda',36],['>abc<',131],[';lada',171],['ypalf',196]])assert.equal(findSectorPassword(input).first,first);
 for(const input of ['',null,undefined,123,'xxxxx','BEDA','ABC',' SH IBA ',':BEDA!'])assert.equal(findSectorPassword(input),null);
});
test('Password sectors are available without unlocking unrelated intermediate rooms',()=>{
 assert.deepEqual(availableSectors(1,[196,197,198,199,200]),[1,196,197,198,199,200]);
 assert.deepEqual(availableSectors(3,[1,3,6,5,6]),[1,2,3,5,6]);
});
