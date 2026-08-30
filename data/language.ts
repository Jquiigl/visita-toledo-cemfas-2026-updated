import {languageCodes,type LanguageCode} from './ui.ts';

export function normalizeLanguage(value:unknown):LanguageCode{
  return typeof value==='string'&&languageCodes.includes(value as LanguageCode)?value as LanguageCode:'es';
}
export const readingDirection=(language:LanguageCode)=>language==='ar'?'rtl':'ltr';
export const forwardArrow=(language:LanguageCode)=>language==='ar'?'←':'→';
export const forwardChevron=(language:LanguageCode)=>language==='ar'?'‹':'›';
export function languageUrl(href:string,language:LanguageCode){
  const url=new URL(href);
  url.searchParams.set('lang',language);
  return `${url.pathname}${url.search}${url.hash}`;
}
