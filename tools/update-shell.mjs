import fs from 'node:fs';
import path from 'node:path';
const root=new URL('../',import.meta.url);
const files=['./','index.html','styles.css','manifest.webmanifest','commit.json'];
function walk(directory){for(const entry of fs.readdirSync(new URL(directory+'/',root),{withFileTypes:true})){
  const name=directory+'/'+entry.name;
  if(entry.isDirectory())walk(name);else files.push(name);
}}
for(const directory of ['js','vendor','assets','icons'])walk(directory);
for(const directory of ['src','vendor','assets'])walk('games/flappy/'+directory);
files.push(...['index.html','style.css','version.js','manifest.webmanifest','manifest.en.webmanifest'].map(f=>'games/flappy/'+f));
const list=[...new Set(files)].sort();
const target=new URL('sw.js',root),source=fs.readFileSync(target,'utf8');
const updated=source.replace(/const SHELL = \[[\s\S]*?\];/,`const SHELL = ${JSON.stringify(list,null,2)};`);
if(process.argv.includes('--check')){if(source!==updated)throw Error('Offline shell is stale. Run node tools/update-shell.mjs');}
else fs.writeFileSync(target,updated);
console.log(`Offline shell: ${list.length} local resources.`);
