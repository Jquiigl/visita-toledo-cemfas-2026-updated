import type {LanguageCode} from './ui.ts';

type CoverCopy={language:string;welcome:string;user:string;userHint:string;admin:string;adminHint:string;choose:string;back:string};
export const coverCopy:Record<LanguageCode,CoverCopy>={
  es:{language:'Idioma',welcome:'Una ciudad. Una jornada compartida.',user:'Usuario',userHint:'Guía, inscripción y valoración',admin:'Administrador',adminHint:'Organización · Usuario y contraseña',choose:'Elige cómo quieres acceder',back:'Portada'},
  en:{language:'Language',welcome:'One city. A day together.',user:'Participant',userHint:'Guide, registration and feedback',admin:'Administrator',adminHint:'Organisation · Username and password',choose:'Choose how to enter',back:'Welcome'},
  fr:{language:'Langue',welcome:'Une ville. Une journée ensemble.',user:'Participant',userHint:'Guide, inscription et évaluation',admin:'Administrateur',adminHint:'Organisation · Identifiant et mot de passe',choose:'Choisissez votre accès',back:'Accueil'},
  it:{language:'Lingua',welcome:'Una città. Una giornata insieme.',user:'Partecipante',userHint:'Guida, iscrizione e valutazione',admin:'Amministratore',adminHint:'Organizzazione · Utente e password',choose:'Scegli come accedere',back:'Benvenuto'},
  de:{language:'Sprache',welcome:'Eine Stadt. Ein gemeinsamer Tag.',user:'Teilnehmer',userHint:'Guide, Anmeldung und Bewertung',admin:'Administrator',adminHint:'Organisation · Benutzername und Passwort',choose:'Zugang wählen',back:'Startseite'},
  ar:{language:'اللغة',welcome:'مدينة واحدة. يوم يجمعنا.',user:'مشارك',userHint:'الدليل والتسجيل وتقييم النشاط',admin:'المسؤول',adminHint:'التنظيم · اسم المستخدم وكلمة المرور',choose:'اختر طريقة الدخول',back:'صفحة الترحيب'},
  ko:{language:'언어',welcome:'하나의 도시. 함께하는 하루.',user:'참가자',userHint:'가이드, 등록 및 평가',admin:'관리자',adminHint:'행사 운영 · 사용자 이름 및 비밀번호',choose:'접속 방법을 선택하세요',back:'첫 화면'},
};

export const guideUrl=(language:LanguageCode)=>`/guia?lang=${language}#home`;
export const coverUrl=(language:LanguageCode)=>`/?lang=${language}`;
export const adminLoginUrl='/admin/login';

// Keep previously shared public hash links working; this never grants admin access.
export function legacyGuideUrl(hash:string,search:string){
  if(!/^#(?:home|program|map|visit|useful|menu|registration|card-[a-z0-9-]+)$/.test(hash))return null;
  return `/guia${search}${hash}`;
}
