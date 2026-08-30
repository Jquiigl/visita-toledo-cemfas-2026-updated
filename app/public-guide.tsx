'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import audioData from '../data/audio-scripts.json';
import { details, mapAttribution } from '../data/details';
import { languageCodes, type LanguageCode, ui } from '../data/ui';
import { evaluationCopy, evaluationFormUrl } from '../data/evaluation';
import {normalizeLanguage,readingDirection,languageUrl,forwardArrow,forwardChevron} from '../data/language';

type MainScreen = 'home'|'program'|'map'|'visit'|'useful'|'menu'|'registration';
type Screen = MainScreen | `card-${string}`;
const FORM_URL = 'https://forms.gle/J88j2NxP6GnCfRT16';
const AEMET_URL = 'https://www.aemet.es/es/eltiempo/prediccion/municipios/toledo-id45168';
const FULL_ROUTE_URL = 'https://www.google.com/maps/dir/?api=1&origin=Iglesia+de+Santo+Tom%C3%A9%2C+Toledo&destination=Museo+del+Ej%C3%A9rcito%2C+Toledo&waypoints=Sinagoga+de+Santa+Mar%C3%ADa+la+Blanca%2C+Toledo%7CCatedral+Primada+de+Toledo&travelmode=walking';

const cardIds = audioData.cards.map((card) => card.id);
const screenFromHash = (): Screen => {
  if (typeof window === 'undefined') return 'home';
  const value = window.location.hash.slice(1) as Screen;
  if (['program','map','visit','useful','menu','registration'].includes(value)) return value;
  if (value.startsWith('card-') && cardIds.includes(value.slice(5))) return value;
  return 'home';
};

const labels: Record<LanguageCode, Record<string,string>> = {
  es:{map:'Mapa',guide:'Guía',schedule:'Horarios y visitas',route:'Recorrido por Toledo',cards:'Fichas, fotos y audios',practical:'Meteo, ropa y acceso',day:'Resumen de la jornada',seeMap:'Ver recorrido en el mapa',routePending:'Orden orientativo. La empresa de guías podrá adaptar el recorrido.',historicRoute:'Recorrido a pie por el casco histórico',expandedSpanish:'La ficha ampliada está disponible inicialmente en español. El resumen y el audio se mantienen en el idioma seleccionado.',highlights:'Datos esenciales',readMore:'Abrir ficha',registration:'Inscripción',openForm:'Abrir formulario de inscripción',sources:'Fuentes y créditos',back:'Volver',nearby:'¿Estoy aquí?',checking:'Comprobando…',mapFull:'Abrir itinerario en Mapas',academyMap:'Abrir Academia en Mapas',publicMap:'Mapa de orientación',transfers:'Traslados posteriores',threeCultures:'Patrimonio de las tres culturas',details:'Desarrollo previsto',summary:'Resumen',audio:'Resumen en audio'},
  en:{map:'Map',guide:'Guide',schedule:'Times and visits',route:'Route through Toledo',cards:'Cards, photos and audio',practical:'Weather, clothing and access',day:'Day overview',seeMap:'View route on the map',routePending:'Indicative order. The guide company may adapt the route.',historicRoute:'Walking route through the historic centre',expandedSpanish:'The extended article is initially available in Spanish. The summary and audio remain in your selected language.',highlights:'Key facts',readMore:'Open card',registration:'Registration',openForm:'Open registration form',sources:'Sources and credits',back:'Back',nearby:'Am I here?',checking:'Checking…',mapFull:'Open route in Maps',academyMap:'Open Academy in Maps',publicMap:'Orientation map',transfers:'Later transfers',threeCultures:'Heritage of three cultures',details:'Planned detail',summary:'Summary',audio:'Audio summary'},
  fr:{map:'Carte',guide:'Guide',schedule:'Horaires et visites',route:'Parcours dans Tolède',cards:'Fiches, photos et audios',practical:'Météo, tenue et accès',day:'Résumé de la journée',seeMap:'Voir le parcours',routePending:'Ordre indicatif. La société de guides pourra adapter le parcours.',historicRoute:'Parcours à pied dans le centre historique',expandedSpanish:'La fiche détaillée est initialement disponible en espagnol. Le résumé et l’audio restent dans la langue choisie.',highlights:'Données essentielles',readMore:'Ouvrir la fiche',registration:'Inscription',openForm:'Ouvrir le formulaire',sources:'Sources et crédits',back:'Retour',nearby:'Suis-je ici ?',checking:'Vérification…',mapFull:'Ouvrir dans Plans',academyMap:'Ouvrir l’Académie',publicMap:'Carte d’orientation',transfers:'Transferts ultérieurs',threeCultures:'Patrimoine des trois cultures',details:'Déroulement prévu',summary:'Résumé',audio:'Résumé audio'},
  it:{map:'Mappa',guide:'Guida',schedule:'Orari e visite',route:'Percorso a Toledo',cards:'Schede, foto e audio',practical:'Meteo, abbigliamento e accesso',day:'Sintesi della giornata',seeMap:'Vedi il percorso',routePending:'Ordine indicativo. La società di guide potrà adattare il percorso.',historicRoute:'Percorso a piedi nel centro storico',expandedSpanish:'La scheda estesa è inizialmente disponibile in spagnolo. Sintesi e audio restano nella lingua selezionata.',highlights:'Dati essenziali',readMore:'Apri scheda',registration:'Iscrizione',openForm:'Apri modulo',sources:'Fonti e crediti',back:'Indietro',nearby:'Sono qui?',checking:'Verifica…',mapFull:'Apri in Mappe',academyMap:'Apri Accademia',publicMap:'Mappa orientativa',transfers:'Trasferimenti successivi',threeCultures:'Patrimonio delle tre culture',details:'Svolgimento previsto',summary:'Sintesi',audio:'Sintesi audio'},
  de:{map:'Karte',guide:'Guide',schedule:'Zeiten und Besuche',route:'Route durch Toledo',cards:'Karten, Fotos und Audio',practical:'Wetter, Kleidung und Zufahrt',day:'Tagesübersicht',seeMap:'Route auf der Karte',routePending:'Unverbindliche Reihenfolge. Das Führungsunternehmen kann die Route anpassen.',historicRoute:'Rundgang durch die Altstadt',expandedSpanish:'Der ausführliche Artikel ist zunächst auf Spanisch verfügbar. Zusammenfassung und Audio bleiben in der gewählten Sprache.',highlights:'Kerndaten',readMore:'Karte öffnen',registration:'Anmeldung',openForm:'Formular öffnen',sources:'Quellen und Bildnachweise',back:'Zurück',nearby:'Bin ich hier?',checking:'Prüfung…',mapFull:'Route in Karten öffnen',academyMap:'Akademie öffnen',publicMap:'Orientierungskarte',transfers:'Weitere Transfers',threeCultures:'Erbe der drei Kulturen',details:'Geplanter Ablauf',summary:'Zusammenfassung',audio:'Audiofassung'},
  ar:{map:'الخريطة',guide:'الدليل',schedule:'المواعيد والزيارات',route:'مسار طليطلة',cards:'بطاقات وصور وصوت',practical:'الطقس والملابس والدخول',day:'ملخص اليوم',seeMap:'عرض المسار',routePending:'الترتيب إرشادي وقد تعدله شركة الدليل.',historicRoute:'جولة سيرًا في المركز التاريخي',expandedSpanish:'المقال الموسع متاح مبدئيًا بالإسبانية. يبقى الملخص والصوت باللغة المختارة.',highlights:'بيانات أساسية',readMore:'فتح البطاقة',registration:'التسجيل',openForm:'فتح نموذج التسجيل',sources:'المصادر وحقوق الصور',back:'رجوع',nearby:'هل أنا هنا؟',checking:'جارٍ التحقق…',mapFull:'فتح المسار في الخرائط',academyMap:'فتح الأكاديمية',publicMap:'خريطة إرشادية',transfers:'التنقلات اللاحقة',threeCultures:'تراث الثقافات الثلاث',details:'التفاصيل المقررة',summary:'ملخص',audio:'ملخص صوتي'},
  ko:{map:'지도',guide:'가이드',schedule:'시간과 방문',route:'톨레도 경로',cards:'안내, 사진 및 음성',practical:'날씨, 복장 및 출입',day:'일정 요약',seeMap:'지도에서 경로 보기',routePending:'안내 순서이며 가이드 회사가 경로를 조정할 수 있습니다.',historicRoute:'역사 지구 도보 경로',expandedSpanish:'상세 기사는 우선 스페인어로 제공됩니다. 요약과 음성은 선택한 언어로 유지됩니다.',highlights:'핵심 정보',readMore:'안내 열기',registration:'등록',openForm:'등록 양식 열기',sources:'출처 및 사진 저작권',back:'뒤로',nearby:'여기가 맞나요?',checking:'확인 중…',mapFull:'지도에서 전체 경로 열기',academyMap:'사관학교 지도 열기',publicMap:'안내 지도',transfers:'이후 이동',threeCultures:'세 문화의 유산',details:'예정 세부 일정',summary:'요약',audio:'음성 요약'}
};

const menuCopy: Record<LanguageCode, {title:string;reference:string;intro:string;adult:string;child:string;adultItems:string[];childItem:string;note:string;dietary:string}> = {
  es:{title:'Menú provisional',reference:'Referencia: actividad del año anterior',intro:'Esta propuesta reproduce el menú servido el año pasado y todavía no constituye el menú confirmado para 2026.',adult:'Menú de adultos',child:'Menú infantil',adultItems:['Entrantes','Arroz con bogavante','Ensalada','Postre'],childItem:'Macarrones',note:'El menú definitivo, sus ingredientes y las bebidas están pendientes de confirmación.',dietary:'Las alergias, intolerancias y necesidades alimentarias deben indicarse en el formulario de inscripción.'},
  en:{title:'Provisional menu',reference:"Reference: last year's activity",intro:"This proposal reproduces last year's menu and is not yet the confirmed menu for 2026.",adult:'Adult menu',child:"Children's menu",adultItems:['Starters','Lobster rice','Salad','Dessert'],childItem:'Macaroni',note:'The final menu, its ingredients and drinks are awaiting confirmation.',dietary:'Allergies, intolerances and dietary requirements must be entered in the registration form.'},
  fr:{title:'Menu provisoire',reference:"Référence : activité de l’année dernière",intro:"Cette proposition reprend le menu servi l’année dernière et ne constitue pas encore le menu confirmé pour 2026.",adult:'Menu adulte',child:'Menu enfant',adultItems:['Entrées','Riz au homard','Salade','Dessert'],childItem:'Macaronis',note:'Le menu définitif, ses ingrédients et les boissons restent à confirmer.',dietary:"Les allergies, intolérances et besoins alimentaires doivent être indiqués dans le formulaire d’inscription."},
  it:{title:'Menu provvisorio',reference:"Riferimento: attività dell’anno scorso",intro:"Questa proposta riprende il menu servito l’anno scorso e non è ancora il menu confermato per il 2026.",adult:'Menu adulti',child:'Menu bambini',adultItems:['Antipasti','Riso con astice','Insalata','Dolce'],childItem:'Maccheroni',note:'Il menu definitivo, gli ingredienti e le bevande sono in attesa di conferma.',dietary:'Allergie, intolleranze ed esigenze alimentari devono essere indicate nel modulo di iscrizione.'},
  de:{title:'Vorläufiges Menü',reference:'Referenz: Veranstaltung des Vorjahres',intro:'Dieser Vorschlag entspricht dem Menü des Vorjahres und ist noch nicht das bestätigte Menü für 2026.',adult:'Menü für Erwachsene',child:'Kindermenü',adultItems:['Vorspeisen','Reis mit Hummer','Salat','Dessert'],childItem:'Makkaroni',note:'Das endgültige Menü, die Zutaten und Getränke müssen noch bestätigt werden.',dietary:'Allergien, Unverträglichkeiten und besondere Ernährungsbedürfnisse sind im Anmeldeformular anzugeben.'},
  ar:{title:'قائمة طعام مؤقتة',reference:'مرجع: نشاط العام الماضي',intro:'يعرض هذا المقترح قائمة الطعام التي قُدمت العام الماضي، وليس القائمة المؤكدة لعام 2026 بعد.',adult:'قائمة البالغين',child:'قائمة الأطفال',adultItems:['مقبلات','أرز بالكركند','سلطة','حلوى'],childItem:'معكرونة',note:'القائمة النهائية ومكوناتها والمشروبات في انتظار التأكيد.',dietary:'يجب ذكر الحساسية وعدم تحمل بعض الأطعمة والاحتياجات الغذائية في نموذج التسجيل.'},
  ko:{title:'임시 메뉴',reference:'참고: 지난해 행사',intro:'이 내용은 지난해 제공된 메뉴를 참고한 것이며 2026년 확정 메뉴가 아닙니다.',adult:'성인 메뉴',child:'어린이 메뉴',adultItems:['전채요리','랍스터 라이스','샐러드','디저트'],childItem:'마카로니',note:'최종 메뉴와 재료 및 음료는 아직 확정되지 않았습니다.',dietary:'알레르기, 음식 불내증 및 특별 식단 요청은 등록 양식에 기재해야 합니다.'}
};

const parkingLinks = [
  {id:'museum',url:'https://www.google.com/maps/search/?api=1&query=Museo+del+Ej%C3%A9rcito%2C+Toledo'},
  {id:'academy',url:'https://www.google.com/maps/search/?api=1&query=Academia+de+Infanter%C3%ADa%2C+Toledo'},
  {id:'residence',url:'https://www.google.com/maps/search/?api=1&query=Residencia+Log%C3%ADstica+Militar+Los+Alijares%2C+Toledo'}
] as const;

const parkingLinkCopy: Record<LanguageCode, {heading:string;museum:string;academy:string;residence:string}> = {
  es:{heading:'Ubicaciones en Google Maps',museum:'Parking · Museo del Ejército',academy:'Academia de Infantería',residence:'RLM Los Alijares'},
  en:{heading:'Locations in Google Maps',museum:'Parking · Army Museum',academy:'Infantry Academy',residence:'RLM Los Alijares'},
  fr:{heading:'Localisations dans Google Maps',museum:'Parking · Musée de l’Armée',academy:'Académie d’Infanterie',residence:'RLM Los Alijares'},
  it:{heading:'Posizioni in Google Maps',museum:'Parcheggio · Museo dell’Esercito',academy:'Accademia di Fanteria',residence:'RLM Los Alijares'},
  de:{heading:'Standorte in Google Maps',museum:'Parkplatz · Armeemuseum',academy:'Infanterieakademie',residence:'RLM Los Alijares'},
  ar:{heading:'المواقع في خرائط Google',museum:'موقف السيارات · متحف الجيش',academy:'أكاديمية المشاة',residence:'RLM Los Alijares'},
  ko:{heading:'Google 지도 위치',museum:'주차장 · 육군박물관',academy:'보병사관학교',residence:'RLM Los Alijares'}
};

type Place = { map:string; official:string; lat?:number; lon?:number };
const places: Record<string,Place> = {
  toledo:{map:'https://www.google.com/maps/search/?api=1&query=Plaza+de+Zocodover%2C+Toledo',official:'https://turismo.toledo.es/toledo.html',lat:39.85955,lon:-4.02155},
  orgaz:{map:'https://www.google.com/maps/search/?api=1&query=Iglesia+de+Santo+Tom%C3%A9%2C+Toledo',official:'https://toledomonumental.com/iglesia-de-santo-tome/',lat:39.85662,lon:-4.02823},
  'santa-maria-la-blanca':{map:'https://www.google.com/maps/search/?api=1&query=Sinagoga+de+Santa+Mar%C3%ADa+la+Blanca%2C+Toledo',official:'https://toledomonumental.com/sinagoga-de-santa-maria-la-blanca/',lat:39.85664,lon:-4.03205},
  catedral:{map:'https://www.google.com/maps/search/?api=1&query=Catedral+Primada+de+Toledo',official:'https://www.catedralprimada.es/',lat:39.85793,lon:-4.02336},
  alcazar:{map:'https://www.google.com/maps/search/?api=1&query=Museo+del+Ej%C3%A9rcito%2C+Toledo',official:'https://ejercito.defensa.gob.es/museo/',lat:39.85861,lon:-4.02017},
  'academia-infanteria':{map:'https://www.google.com/maps/search/?api=1&query=Academia+de+Infanter%C3%ADa+de+Toledo',official:'https://ejercito.defensa.gob.es/unidades/Toledo/acinf/'},
  'gastronomia-recuerdos':{map:'https://www.google.com/maps/search/?api=1&query=Artesan%C3%ADa+y+gastronom%C3%ADa+Toledo',official:'https://turismo.toledo.es/'}
};

const mapPins = [
  {id:'orgaz',number:1,left:'31%',top:'54%'},
  {id:'santa-maria-la-blanca',number:2,left:'18%',top:'64%'},
  {id:'catedral',number:3,left:'60%',top:'52%'},
  {id:'alcazar',number:4,left:'86%',top:'40%'}
];

function distanceMetres(aLat:number,aLon:number,bLat:number,bLon:number){const r=6371e3,toRad=(n:number)=>n*Math.PI/180,p1=toRad(aLat),p2=toRad(bLat),dp=toRad(bLat-aLat),dl=toRad(bLon-aLon),h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return r*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
function External(){return <span aria-hidden="true">↗</span>}

export default function PublicGuide({initialLanguage='es'}:{initialLanguage?:LanguageCode}){
  const [language,setLanguage]=useState<LanguageCode>(initialLanguage);
  const [screen,setScreen]=useState<Screen>('home');
  const [locationState,setLocationState]=useState<Record<string,'checking'|'near'|'far'|'inaccurate'|'denied'>>({});
  const copy=ui[language],text=labels[language],menu=menuCopy[language],parkingText=parkingLinkCopy[language],isRtl=language==='ar';
  const cards=useMemo(()=>audioData.cards.map(card=>({...card,title:card.titles[language],body:card.texts[language],detail:details[card.id]})),[language]);
  const currentId=screen.startsWith('card-')?screen.slice(5):null;
  const current=cards.find(card=>card.id===currentId);

  useEffect(()=>{const initial=screenFromHash();const id=window.setTimeout(()=>setScreen(initial),0);window.history.replaceState({...window.history.state,toledo:true,depth:0,screen:initial},'',`#${initial}`);const onPop=()=>{setScreen(screenFromHash());setLanguage(normalizeLanguage(new URLSearchParams(window.location.search).get('lang')));};window.addEventListener('popstate',onPop);return()=>{window.clearTimeout(id);window.removeEventListener('popstate',onPop)}},[]);
  useEffect(()=>{document.documentElement.lang=language;document.documentElement.dir=readingDirection(language);return()=>{document.documentElement.lang='es';document.documentElement.dir='ltr';}},[language]);
  useEffect(()=>{if('serviceWorker'in navigator)navigator.serviceWorker.register('/service-worker.js').catch(()=>undefined)},[]);
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'})},[screen]);

  const changeLanguage=(value:string)=>{const next=normalizeLanguage(value);window.history.replaceState(window.history.state,'',languageUrl(window.location.href,next));setLanguage(next);};
  const navigate=(next:Screen)=>{const depth=Number(window.history.state?.depth??0)+1;window.history.pushState({...window.history.state,toledo:true,depth,screen:next},'',`#${next}`);setScreen(next)};
  const back=()=>{if(Number(window.history.state?.depth??0)>0)window.history.back();else{window.history.replaceState({toledo:true,depth:0,screen:'home'},'','#home');setScreen('home')}};
  const activeMain:MainScreen=current?'visit':screen==='menu'?'useful':screen as MainScreen;
  const screenTitle=current?.title??({home:copy.subtitle,program:copy.program,map:text.map,visit:text.guide,useful:copy.useful,menu:menu.title,registration:text.registration}[screen as MainScreen]);
  const imageUrl=(path:string)=>`/${path}`;

  const checkLocation=(id:string,place:Place)=>{if(!navigator.geolocation||place.lat===undefined||place.lon===undefined){setLocationState(s=>({...s,[id]:'denied'}));return}setLocationState(s=>({...s,[id]:'checking'}));navigator.geolocation.getCurrentPosition(({coords})=>{const d=distanceMetres(coords.latitude,coords.longitude,place.lat!,place.lon!);setLocationState(s=>({...s,[id]:coords.accuracy>150?'inaccurate':d<=Math.max(120,coords.accuracy)?'near':'far'}))},()=>setLocationState(s=>({...s,[id]:'denied'})),{enableHighAccuracy:true,maximumAge:0,timeout:10000})};
  const locationMessage=(state?:string)=>state==='checking'?text.checking:state==='near'?copy.locationNear:state==='far'?copy.locationFar:state==='inaccurate'?copy.locationInaccurate:state==='denied'?copy.locationDenied:'';

  return <main className="app-shell" lang={language} dir={readingDirection(language)}>
    <header className="app-header">
      {screen!=='home'?<button className="back-button" onClick={back} aria-label={text.back}>{isRtl?'›':'‹'}</button>:<img src={imageUrl('images/app-icon-192.png')} alt=""/>}
      <div className="app-title"><strong>TOLEDO</strong><small>{screenTitle}</small></div>
      <select value={language} onChange={e=>changeLanguage(e.target.value)} aria-label="Language">{languageCodes.map(code=><option key={code} value={code}>{ui[code].language}</option>)}</select>
    </header>

    {screen==='home'&&<section className="screen home-screen">
      <div className="v2-ribbon" lang="es" dir="ltr"><span>V2 · Prototipo</span><Link href="/admin">Organización →</Link></div>
      <section className="evaluation-callout" aria-label={evaluationCopy[language].button}>
        <a className="primary-action link-button" href={evaluationFormUrl} target="_blank" rel="noreferrer" aria-describedby="evaluation-notice">{evaluationCopy[language].button} <External/></a>
        <p id="evaluation-notice">{evaluationCopy[language].notice}<strong>{evaluationCopy[language].deadline}</strong></p>
      </section>
      <div className="compact-hero"><img src={imageUrl('images/hero-wide-1600.png')} alt="Vista panorámica de Toledo al atardecer"/></div>
      <div className="home-copy"><p className="eyebrow">{copy.date}</p><h1>{copy.title}</h1><p>{copy.lead}</p></div>
      <div className="next-card"><span>24</span><div><small lang="es" dir="ltr">OCT · 2026</small><strong dir="ltr">08:45 · CESEDEN</strong><p>{copy.schedule[0][1]} · {copy.provisional}</p></div></div>
      <div className="alert"><strong>{copy.noticeTitle}</strong><span>{copy.noticeBody}</span></div>
      <div className="menu-grid">
        <button onClick={()=>navigate('program')}><span>◷</span><strong>{copy.program}</strong><small>{text.schedule}</small></button>
        <button onClick={()=>navigate('map')}><span>⌖</span><strong>{text.map}</strong><small>{text.route}</small></button>
        <button onClick={()=>navigate('visit')}><span>▤</span><strong>{text.guide}</strong><small>{text.cards}</small></button>
        <button onClick={()=>navigate('useful')}><span>ⓘ</span><strong>{copy.useful}</strong><small>{text.practical}</small></button>
      </div>
      <button className="provisional-menu-tab" onClick={()=>navigate('menu')}><span>♨</span><div><small>{copy.provisional}</small><strong>{menu.title}</strong><p>{menu.reference}</p></div><i aria-hidden="true">{forwardChevron(language)}</i></button>
      <button className="primary-action" onClick={()=>navigate('registration')}>{text.registration} <span aria-hidden="true">{forwardArrow(language)}</span></button>
    </section>}

    {screen==='program'&&<section className="screen">
      <div className="screen-heading"><span className="status">{copy.provisional}</span><h1>{copy.programTitle}</h1><p>{copy.noticeBody}</p></div>
      <div className="day-summary"><div><strong>08:45</strong><small>CESEDEN</small></div><div><strong>10:00</strong><small>TOLEDO</small></div><div><strong>17:00</strong><small>MADRID</small></div></div>
      <ol className="program-list">
        {copy.schedule.map(([time,title,detail],index)=><li key={`${time}-${title}`}><time dir="ltr">{time}</time><div><strong>{title}</strong>{detail&&<span>{detail}</span>}
          {index===0&&language==='es'&&<p>Recepción de participantes, comprobación organizativa y distribución en los transportes previstos.</p>}
          {index===2&&<div className="program-feature"><b>{text.historicRoute}</b><p>{language==='es'?'Recorrido guiado contratado por las calles del casco histórico. La secuencia y los tiempos interiores se ajustarán con la empresa.':text.routePending}</p><div className="stop-chips">{cards.filter(c=>['orgaz','santa-maria-la-blanca','catedral','alcazar'].includes(c.id)).map((c,i)=><button key={c.id} onClick={()=>navigate(`card-${c.id}`)}>{i+1} · {c.title}</button>)}</div></div>}
          {index===3&&language==='es'&&<p>Final del recorrido cultural, reunión del grupo y desplazamiento organizado hacia la Academia.</p>}
          {index===4&&<div className="program-feature"><b>{text.details}</b><p>{language==='es'?'Edificio Noble, Sala de Laureados, Sala de la Medalla Militar Individual y comedor. Acceso, identificación y fotografía según instrucciones de la Academia.':detail}</p></div>}
          {index===5&&language==='es'&&<p>Comida de confraternización en el comedor de la Residencia Logística Militar Los Alijares.</p>}
        </div></li>)}
      </ol>
      <div className="route-note">ⓘ {text.routePending}</div>
      <button className="primary-action" onClick={()=>navigate('map')}>{text.seeMap} <span aria-hidden="true">{forwardArrow(language)}</span></button>
    </section>}

    {screen==='map'&&<section className="screen map-screen">
      <div className="screen-heading"><span className="status">{copy.provisional}</span><h1>{text.publicMap}</h1><p>{text.routePending}</p></div>
      <div className="map-frame"><img src={imageUrl('images/places/map-toledo.png')} alt="Mapa del casco histórico de Toledo"/>{mapPins.map(pin=>{const card=cards.find(c=>c.id===pin.id)!;return <button key={pin.id} className="map-pin" style={{left:pin.left,top:pin.top}} onClick={()=>navigate(`card-${pin.id}`)} aria-label={`${pin.number}. ${card.title}`}><span>{pin.number}</span></button>})}</div>
      <ol className="map-legend">{mapPins.map(pin=>{const card=cards.find(c=>c.id===pin.id)!;return <li key={pin.id}><button onClick={()=>navigate(`card-${pin.id}`)}><b>{pin.number}</b><span>{card.title}</span><i aria-hidden="true">{forwardChevron(language)}</i></button></li>})}</ol>
      <a className="primary-action link-button" href={FULL_ROUTE_URL} target="_blank" rel="noreferrer">{text.mapFull}<External/></a>
      <p className="map-credit" lang="es" dir="ltr">Mapa: <a href={mapAttribution.commons} target="_blank" rel="noreferrer">{mapAttribution.credit}</a> · {mapAttribution.license}</p>
      <article className="transfer-card"><img src={imageUrl(details['academia-infanteria'].image)} alt={details['academia-infanteria'].alt}/><div><small>{text.transfers}</small><h2>{cards.find(c=>c.id==='academia-infanteria')?.title}</h2><p>{language==='es'?'El traslado desde el casco histórico será organizado. El punto exacto de acceso se publicará cuando quede confirmado.':copy.parkingBody}</p><a href={places['academia-infanteria'].map} target="_blank" rel="noreferrer">{text.academyMap}<External/></a></div></article>
    </section>}

    {screen==='visit'&&<section className="screen guide-screen">
      <div className="screen-heading"><span className="status">7 {copy.visit}</span><h1>{copy.visitTitle}</h1><p>{copy.visitIntro}</p></div>
      <div className="guide-list">{cards.map(card=><button className="guide-card" key={card.id} onClick={()=>navigate(`card-${card.id}`)}><img src={imageUrl(card.detail.image)} alt=""/><div><small lang="es" dir="ltr">{card.detail.facts[0][1]}</small><h2>{card.title}</h2><p>{language==='es'?card.detail.short:`${card.body.slice(0,145)}…`}</p><b>{text.readMore} <span aria-hidden="true">{forwardArrow(language)}</span></b></div></button>)}</div>
    </section>}

    {current&&<article className="detail-screen">
      <div className="detail-photo"><img src={imageUrl(current.detail.image)} alt={current.detail.alt}/><div className="photo-caption" lang="es" dir="ltr">{current.detail.credit} · {current.detail.license}</div></div>
      <div className="screen detail-body"><p className="eyebrow">{text.guide}</p><h1>{current.title}</h1><p className="detail-lead">{current.body}</p>
        <section className="facts"><h2>{text.highlights}</h2><dl lang="es" dir="ltr">{current.detail.facts.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
        {language==='es'?<div className="article-sections">{current.detail.sections.map(section=><section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}</div>:<div className="translation-note">ⓘ {text.expandedSpanish}</div>}
        <section className="audio-panel"><div><span>▶</span><div><small>{text.audio}</small><strong>{current.title}</strong></div></div><audio dir="ltr" controls preload="none" src={imageUrl(`audio/${language}/${current.id}.wav`)} aria-label={`${copy.listen}: ${current.title}`}/></section>
        <div className="detail-actions"><a href={places[current.id].map} target="_blank" rel="noreferrer">{copy.map}<External/></a><a href={places[current.id].official} target="_blank" rel="noreferrer">{copy.official}<External/></a>{places[current.id].lat!==undefined&&<button onClick={()=>checkLocation(current.id,places[current.id])} disabled={locationState[current.id]==='checking'}>{text.nearby}</button>}</div>
        {locationMessage(locationState[current.id])&&<p className={`location-result ${locationState[current.id]}`} role="status">{locationMessage(locationState[current.id])}</p>}
        {places[current.id].lat!==undefined&&<p className="location-privacy">{copy.locationPrivacy}</p>}
        <section className="sources"><h2>{text.sources}</h2><p>{copy.sourcesBody}</p><ul lang="es" dir="ltr">{current.detail.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}<External/></a></li>)}<li><a href={current.detail.commons} target="_blank" rel="noreferrer">Wikimedia Commons · {current.detail.credit} · {current.detail.license}<External/></a></li></ul></section>
      </div>
    </article>}

    {screen==='useful'&&<section className="screen useful-screen">
      <div className="screen-heading"><h1>{copy.usefulTitle}</h1><p>{copy.noticeBody}</p></div>
      <div className="info-list"><article><span>☀</span><div><h2>{copy.weatherTitle}</h2><p>{copy.weatherBody}</p><a href={AEMET_URL} target="_blank" rel="noreferrer">AEMET · Toledo <External/></a></div></article><article className="parking-card"><span>P</span><div><h2>{copy.parkingTitle}</h2><p>{copy.parkingBody}</p><strong className="parking-links-title">{parkingText.heading}</strong><div className="parking-links">{parkingLinks.map(place=><a key={place.id} href={place.url} target="_blank" rel="noreferrer"><span>⌖</span>{parkingText[place.id]}<External/></a>)}</div></div></article><article><span>♨</span><div><h2>{menu.title}</h2><p>{menu.reference}</p><button className="inline-link" onClick={()=>navigate('menu')}>{menu.title} <span aria-hidden="true">{forwardArrow(language)}</span></button></div></article><article><span>♢</span><div><h2>{copy.clothingTitle}</h2><p>{copy.clothingBody}</p></div></article><article><span>☎</span><div><h2>{copy.contactTitle}</h2><p>{copy.contactBody}</p><b>{copy.provisional}</b></div></article></div>
      <button className="primary-action" onClick={()=>navigate('registration')}>{text.registration} <span aria-hidden="true">{forwardArrow(language)}</span></button>
    </section>}

    {screen==='menu'&&<section className="screen menu-screen">
      <div className="screen-heading"><span className="status">{copy.provisional}</span><h1>{menu.title}</h1><p>{menu.intro}</p></div>
      <div className="menu-reference">{menu.reference}</div>
      <div className="meal-cards">
        <article><div className="meal-card-heading"><span>01</span><h2>{menu.adult}</h2></div><ol>{menu.adultItems.map(item=><li key={item}>{item}</li>)}</ol></article>
        <article className="child-meal"><div className="meal-card-heading"><span>02</span><h2>{menu.child}</h2></div><div className="child-dish">{menu.childItem}</div></article>
      </div>
      <div className="menu-warning"><strong>{copy.provisional}</strong><p>{menu.note}</p></div>
      <p className="dietary-note">ⓘ {menu.dietary}</p>
      <button className="primary-action" onClick={()=>navigate('registration')}>{text.registration} <span aria-hidden="true">{forwardArrow(language)}</span></button>
    </section>}

    {screen==='registration'&&<section className="screen registration-screen"><div className="registration-icon">✓</div><span className="status">Google Forms</span><h1>{copy.registrationTitle}</h1><p>{copy.registrationBody}</p><div className="deadline">{copy.deadline}</div><a className="primary-action link-button" href={FORM_URL} target="_blank" rel="noreferrer">{text.openForm}<External/></a><p className="privacy-box">⌾ {copy.privacy}</p></section>}

    {!current&&<nav className="tab-bar" aria-label="Main navigation">{([['home','⌂',copy.home],['program','◷',copy.program],['map','⌖',text.map],['visit','▤',text.guide],['useful','ⓘ',copy.useful]] as [MainScreen,string,string][]).map(([id,icon,label])=><button key={id} className={activeMain===id?'active':''} onClick={()=>navigate(id)}><span>{icon}</span><small>{label}</small></button>)}</nav>}
  </main>;
}
