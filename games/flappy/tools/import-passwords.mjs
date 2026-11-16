import fs from 'node:fs';
const text=fs.readFileSync(process.argv[2],'utf8');
const entries=[...text.matchAll(/^(\d{3})-(\d{3}): (\S{5})\s*$/gm)].map(([,first,last,code])=>({first:Number(first),last:Number(last),code}));
if(entries.length!==40||entries.some((e,i)=>e.first!==i*5+1||e.last!==i*5+5))throw Error('Unexpected password list');
fs.writeFileSync('assets/sector-passwords.js','// Original sector passwords: https://www.pmd85.cz/wp-content/uploads/hesla.txt\nexport const sectorPasswords = '+JSON.stringify(entries)+';\n');
console.log('Imported 40 sector-password groups.');
