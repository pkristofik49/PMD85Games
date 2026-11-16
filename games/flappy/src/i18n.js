import {translations} from './translations.js';
export const LANGUAGE_KEY='flappy.language';
export const languages=translations.languages;
export function loadLanguage(storage){
  try{const saved=(storage??globalThis.localStorage).getItem(LANGUAGE_KEY);if(languages.some(option=>option.code===saved))return saved}catch{/* Switching also works without storage. */}
  return 'cs';
}
export function translate(language,key,parameters={}){
  const text=translations[language]?.[key]??translations.cs[key]??key;
  return text.replace(/\{(\w+)\}/g,(placeholder,name)=>parameters[name]??placeholder);
}
export function plural(language,key,count){
  const locale=languages.find(option=>option.code===language)?.locale??languages[0].locale;
  const category=new Intl.PluralRules(locale).select(count);
  const selected=`${key}.${category}`;
  return translate(language,Object.hasOwn(translations[language]??translations.cs,selected)?selected:`${key}.other`,{count});
}
