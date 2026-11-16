// Generated HTML fallbacks and PWA metadata share the UI's translation source.
import fs from 'node:fs';
import {translate,languages} from '../src/i18n.js';
const root=new URL('../',import.meta.url),check=process.argv.includes('--check');
function output(file,text){
  const url=new URL(file,root);
  if(check){if(!fs.existsSync(url)||fs.readFileSync(url,'utf8').replace(/\r\n/g,'\n')!==text)throw Error(`Regenerate localized files: node tools/localize-static.mjs (${file})`)}
  else fs.writeFileSync(url,text);
}
const escape=text=>text.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const index=fs.readFileSync(new URL('index.html',root),'utf8').replace(/\r\n/g,'\n');
output('index.html',index
  .replace(/<title>[^<]*<\/title>/,`<title>${escape(translate('cs','meta.title'))}</title>`)
  .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${escape(translate('cs','meta.description'))}">`)
  .replace(/<noscript>[\s\S]*?<\/noscript>/,`<noscript>${languages.map(({code})=>`<p lang="${code}">${escape(translate(code,'meta.noscript'))}</p>`).join('')}</noscript>`));
const base=JSON.parse(fs.readFileSync(new URL('manifest.webmanifest',root),'utf8'));
for(const {code}of languages){
  const manifest={...base,name:translate(code,'brand.appName'),short_name:translate(code,'brand.shortName'),description:translate(code,'pwa.description'),lang:code};
  output(code==='cs'?'manifest.webmanifest':`manifest.${code}.webmanifest`,JSON.stringify(manifest,null,2)+'\n');
}
console.log(check?'Localized HTML and manifests OK':'Localized HTML and manifests generated');
