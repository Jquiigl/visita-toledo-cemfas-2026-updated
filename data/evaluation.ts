import type {LanguageCode} from './ui';

export const evaluationFormUrl = 'https://forms.gle/NKp7nyVtAEZfZz2T8';
export const evaluationDeadline = '2026-10-28';
export const evaluationCopy: Record<LanguageCode, {button:string;notice:string;deadline:string}> = {
  es: {button:'Valorar la actividad',notice:'Se ruega realizar la valoración una vez finalizada la actividad.',deadline:'Fecha límite: 28 de octubre de 2026 (inclusive).'},
  en: {button:'Rate the activity',notice:'Please complete the survey after the activity has finished.',deadline:'Deadline: 28 October 2026 (inclusive).'},
  fr: {button:'Évaluer l’activité',notice:'Merci de remplir le questionnaire une fois l’activité terminée.',deadline:'Date limite : le 28 octobre 2026 inclus.'},
  it: {button:'Valutare l’attività',notice:'Si prega di compilare il questionario al termine dell’attività.',deadline:'Scadenza: 28 ottobre 2026 compreso.'},
  de: {button:'Aktivität bewerten',notice:'Bitte füllen Sie die Umfrage erst nach Abschluss der Aktivität aus.',deadline:'Frist: einschließlich 28. Oktober 2026.'},
  ar: {button:'تقييم النشاط',notice:'يرجى تعبئة استبيان التقييم بعد انتهاء النشاط.',deadline:'آخر موعد: 28 أكتوبر 2026، شاملًا هذا اليوم.'},
  ko: {button:'활동 평가하기',notice:'활동이 종료된 후 평가 설문을 작성해 주시기 바랍니다.',deadline:'마감일: 2026년 10월 28일 (당일 포함).'},
};
