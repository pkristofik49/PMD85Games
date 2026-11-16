import { cpSync, mkdirSync, rmSync } from 'node:fs';
// This script only removes the fixed build output in this repository.
const output=new URL('../dist/',import.meta.url);
rmSync(output,{recursive:true,force:true});mkdirSync(output);
for(const file of ['index.html','style.css','version.js','manifest.webmanifest','manifest.en.webmanifest','sw.js','.nojekyll','assets','src','vendor'])cpSync(new URL('../'+file,import.meta.url),new URL(file,output),{recursive:true});
console.log('Static site ready in dist/');
