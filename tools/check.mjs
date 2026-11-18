import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const sandbox={};vm.createContext(sandbox);vm.runInContext(fs.readFileSync('js/translations.js','utf8'),sandbox);
const dictionaries=sandbox.PmdTranslations;assert.deepEqual(Object.keys(dictionaries.cs).sort(),Object.keys(dictionaries.en).sort());
const version=fs.readFileSync('js/version.js','utf8').match(/ArcadeVersion = '(\d+\.\d{3})'/)[1];
assert.equal(fs.readFileSync('sw.js','utf8').match(/const RELEASE = '([^']+)'/)[1],version);
assert.equal(JSON.parse(fs.readFileSync('commit.json','utf8')).version,version);
for(const directory of ['js','assets'])for(const file of fs.readdirSync(directory).filter(f=>f.endsWith('.js')))execFileSync(process.execPath,['--check',directory+'/'+file]);
execFileSync(process.execPath,['tools/update-shell.mjs','--check'],{stdio:'inherit'});
execFileSync(process.execPath,['tools/export-pampuch-sprites.mjs','--check'],{stdio:'inherit'});
for(const match of fs.readFileSync('index.html','utf8').matchAll(/(?:src|href)="([^"#]+)"/g)){
 const file=match[1];if(file.startsWith('https:')||file.includes('?')||file.startsWith('games/flappy/index'))continue;
 assert.ok(fs.existsSync(file),'Missing resource: '+file);
}
console.log('Translations, syntax, versions and local resources verified.');
