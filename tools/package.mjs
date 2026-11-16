import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const root=process.cwd(),dist=path.resolve(root,'dist');
if(path.dirname(dist)!==root)throw Error('Invalid package destination');
fs.mkdirSync(dist,{recursive:true});
for(const entry of ['index.html','styles.css','manifest.webmanifest','sw.js','js','vendor','assets','icons'])fs.cpSync(entry,path.join(dist,entry),{recursive:true});
fs.mkdirSync(path.join(dist,'games/flappy'),{recursive:true});
for(const entry of ['index.html','style.css','version.js','manifest.webmanifest','manifest.en.webmanifest','src','vendor','assets'])fs.cpSync('games/flappy/'+entry,path.join(dist,'games/flappy',entry),{recursive:true});
const metadata=JSON.parse(fs.readFileSync('commit.json','utf8'));
try{metadata.commit=execFileSync('git',['rev-parse','HEAD'],{stdio:['ignore','pipe','ignore']}).toString().trim();}
catch{metadata.commit='';}
fs.writeFileSync(path.join(dist,'commit.json'),JSON.stringify(metadata)+'\n');fs.writeFileSync(path.join(dist,'.nojekyll'),'');
console.log('GitHub Pages package ready in dist/.');
