import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {translations} from '../src/translations.js';
import {languages,LANGUAGE_KEY,loadLanguage,translate,plural} from '../src/i18n.js';
import {Game} from '../src/engine.js';

test('Every Czech text has an English translation with matching placeholders',()=>{
 const keys=Object.keys(translations.cs).sort();
 for(const {code}of languages){
  assert.deepEqual(Object.keys(translations[code]).sort(),keys);
  for(const key of keys){
   const text=translations[code][key];assert.ok(typeof text==='string'&&text.trim(),`${code}: ${key}`);
   const tokens=value=>[...value.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
   assert.deepEqual(tokens(text),tokens(translations.cs[key]),`${code}: ${key}`);
  }
 }
});
test('Translation placeholders remain plain text and unknown languages fall back to Czech',()=>{
 assert.equal(translate('en','win.scene',{scene:2}),'Scene 2 solved.');
 assert.equal(translate('en','win.scene',{scene:'<img onerror="test">'}),'Scene <img onerror="test"> solved.');
 assert.equal(translate('unknown','action.resume'),translations.cs['action.resume']);
 assert.equal(translate('en','missing.key'),'missing.key');
 assert.equal(translate('en','win.scene'),'Scene {scene} solved.');
});
test('Language restoration handles missing, invalid and unavailable storage',()=>{
 for(const [saved,expected]of [[null,'cs'],['en','en'],['cs','cs'],['xx','cs']])assert.equal(loadLanguage({getItem(key){assert.equal(key,LANGUAGE_KEY);return saved}}),expected);
 assert.equal(loadLanguage({getItem(){throw Error('Storage blocked')}}),'cs');
});
test('Accessible life counts use Czech and English plural rules',()=>{
 assert.equal(plural('cs','game.lives',1),'1 život');assert.equal(plural('cs','game.lives',3),'3 životy');assert.equal(plural('cs','game.lives',5),'5 životů');
 assert.equal(plural('en','game.lives',1),'1 life');assert.equal(plural('en','game.lives',3),'3 lives');assert.equal(plural('en','game.lives',0),'0 lives');
});
test('Death causes are language-independent keys which translate after the event',()=>{
 const g=new Game({walls:[],objects:[{type:3,x:5,y:1}]});g.player.x=5;g.player.y=3;g.tick();
 assert.equal(g.state,'dead');assert.equal(g.reason,'death.falling');
 assert.equal(translate('en',g.reason),'Watch out for falling stones and the blue crystal.');
 assert.equal(translate('cs',g.reason),'Pozor na padající kameny i modrý krystal.');
});
test('All UI translation keys, including notices and engine messages, are defined',()=>{
 const prefix='brand|meta|pwa|language|password|graphics|shortcut|view|status|action|intro|game|key|pause|death|win|sound|touch|direction|guide|keys|scene|notice|about|footer';
 const pattern=new RegExp(`['"]((?:${prefix})\\.[A-Za-z.]+)['"]`,'g');
 for(const file of ['index.html','src/app.js','src/engine.js','src/render.js']){
  const text=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  for(const match of text.matchAll(pattern)){const key=match[1];assert.ok(Object.hasOwn(translations.cs,key)||Object.hasOwn(translations.cs,key+'.other'),`${file}: ${key}`)}
 }
});
test('Both installable manifests use translations and retain the same application identity',()=>{
 const cs=JSON.parse(fs.readFileSync(new URL('../manifest.webmanifest',import.meta.url),'utf8'));
 for(const {code}of languages){
  const file=code==='cs'?'manifest.webmanifest':`manifest.${code}.webmanifest`;
  const m=JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));
  assert.equal(m.lang,code);assert.equal(m.description,translate(code,'pwa.description'));assert.equal(m.name,translate(code,'brand.appName'));assert.equal(m.id,cs.id);assert.equal(m.scope,cs.scope);assert.equal(m.start_url,cs.start_url);
 }
});
