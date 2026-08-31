'use client';

import {useEffect,useState} from 'react';
import {languageCodes,ui,type LanguageCode} from '../data/ui';
import {languageUrl,normalizeLanguage,readingDirection,forwardArrow} from '../data/language';
import {coverCopy,guideUrl,adminLoginUrl,legacyGuideUrl} from '../data/cover';
import './cover.css';

export default function Cover({initialLanguage='es'}:{initialLanguage?:LanguageCode}){
  const [language,setLanguage]=useState(initialLanguage);
  const copy=coverCopy[language];
  useEffect(()=>{
    const legacy=legacyGuideUrl(window.location.hash,window.location.search);
    if(legacy)window.location.replace(legacy);
    const sync=()=>setLanguage(normalizeLanguage(new URLSearchParams(window.location.search).get('lang')));
    window.addEventListener('popstate',sync);
    return()=>window.removeEventListener('popstate',sync);
  },[]);
  useEffect(()=>{
    document.documentElement.lang=language;
    document.documentElement.dir=readingDirection(language);
    return()=>{document.documentElement.lang='es';document.documentElement.dir='ltr';};
  },[language]);
  function changeLanguage(value:string){
    const next=normalizeLanguage(value);
    setLanguage(next);
    window.history.replaceState(null,'',languageUrl(window.location.href,next));
  }
  return <main className="toledo-cover" lang={language} dir={readingDirection(language)}>
    <div className="cover-artwork"><img className="cover-city" src="/images/cover-toledo.png" alt="" width="688" height="1472" fetchPriority="high"/></div>
    <div className="cover-inner">
      <header className="cover-top"><span className="cover-institution" dir="ltr">CEMFAS · 2026</span><label className="cover-language"><span>{copy.language}</span><select value={language} onChange={e=>changeLanguage(e.target.value)}>{languageCodes.map(code=><option key={code} value={code}>{ui[code].language}</option>)}</select></label></header>
      <section className="cover-content" aria-labelledby="cover-title">
        <h1 id="cover-title" className="cover-accessible-title" dir="ltr">TOLEDO</h1>
        <p className="cover-eyebrow">{ui[language].subtitle}</p>
        <p className="cover-welcome">{copy.welcome}</p>
        <p className="cover-date">{ui[language].date}</p>
        <nav className="cover-access" aria-label={copy.choose}>
          <a className="cover-user" href={guideUrl(language)}><span><strong>{copy.user}</strong><small>{copy.userHint}</small></span><span aria-hidden="true">{forwardArrow(language)}</span></a>
          <a className="cover-admin" href={adminLoginUrl}><span><strong>{copy.admin}</strong><small>{copy.adminHint}</small></span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg></a>
        </nav>
      </section>
      <footer className="cover-footer"><span>{ui[language].noticeTitle}</span><span dir="ltr">TOLEDO · V2</span></footer>
    </div>
  </main>;
}
