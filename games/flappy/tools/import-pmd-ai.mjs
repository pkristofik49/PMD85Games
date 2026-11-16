// Original bitmap bytes used as collision probes by the 1987 PMD enemy drivers.
import fs from 'node:fs';
const tape=fs.readFileSync(process.argv[2]),blocks=[];
for(let p=0;p<tape.length;){const size=tape.readUInt16LE(p);blocks.push(tape.subarray(p+2,p+size+2));p+=size+2}
const header=blocks.findIndex(b=>b.length===63&&b.subarray(54,62).toString()==='*FLAPPY*');
if(header<0)throw Error('Missing original *FLAPPY*');
const program=blocks[header+3].subarray(0x71);
if(program[0x1c15]!==0x3e||program[0x1c16]!==3)throw Error('Unexpected original program');
const sources={crystal:[0x0132,2],rock:[0x0158,2],wall:[0x0529,1],playerDown:[0x02a5,2],playerUp:[0x0259,2],playerLeft:[0x027f,2],playerRight:[0x0233,2],ghostLeft:[0x041f,2],ghostRight:[0x03f9,2],ghostSleep:[0x0445,2],frogDown:[0x05a7,2],frogUp:[0x1130,2],frogLeft:[0x110a,2],frogRight:[0x1156,2],frogSleep:[0x0f6b,2],mushroom:[0x0192,1],ghostCorpse:[0x07cd,2],frogCorpse:[0x0503,2]};
sources.goal=[0x017e,2];
const probes={};
for(const [name,[address,count]]of Object.entries(sources)){
 let p=address;probes[name]=Array.from({length:count},()=>{const bytes=[];while(program[p]!==255&&bytes.length<27)bytes.push(program[p++]);if(program[p++]!==255)throw Error(name);return bytes});
}
fs.writeFileSync('assets/pmd-ai-probes.js','// Native 1987 PMD bitmap collision bytes. See SOURCES.md.\nexport const pmdProbes = '+JSON.stringify(probes)+';\n');
console.log('Imported native PMD enemy collision probes.');
