import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,copyFileSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
test('Commit hook starts at 1.000, increments, survives failed attempts and rolls over',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'flappy-hook-'));
 const git=(...args)=>execFileSync('git',args,{cwd:dir,encoding:'utf8',stdio:['ignore','pipe','pipe']});
 try{
  git('init','-b','main');git('config','user.name','Hook Test');git('config','user.email','test@example.invalid');git('config','commit.gpgsign','false');git('config','core.hooksPath','.githooks');git('config','core.autocrlf','false');
  mkdirSync(path.join(dir,'.githooks'));copyFileSync(new URL('../.githooks/pre-commit',import.meta.url),path.join(dir,'.githooks/pre-commit'));
  writeFileSync(path.join(dir,'VERSION'),'1.000\n');writeFileSync(path.join(dir,'version.js'),'globalThis.FLAPPY_VERSION = "1.000";\n');git('add','.');git('update-index','--chmod=+x','.githooks/pre-commit');git('commit','-m','initial');
  assert.equal(git('show','HEAD:VERSION').trim(),'1.000');
  writeFileSync(path.join(dir,'game.txt'),'change');git('add','game.txt');git('commit','-m','second');assert.equal(git('show','HEAD:VERSION').trim(),'1.001');
  // An aborted commit must not permanently consume a number.
  writeFileSync(path.join(dir,'game.txt'),'next');git('add','game.txt');assert.throws(()=>git('commit','-m',''));git('commit','-m','third');assert.equal(git('show','HEAD:VERSION').trim(),'1.002');
  git('commit','--amend','-m','amended');assert.equal(git('show','HEAD:VERSION').trim(),'1.003');
  // Create a boundary fixture without the hook; the following normal commit rolls over.
  writeFileSync(path.join(dir,'VERSION'),'1.999\n');git('add','VERSION');git('-c','core.hooksPath=/dev/null','commit','-m','boundary');git('commit','--allow-empty','-m','rollover');assert.equal(git('show','HEAD:VERSION').trim(),'2.000');
  assert.match(readFileSync(path.join(dir,'version.js'),'utf8'),/2\.000/);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
