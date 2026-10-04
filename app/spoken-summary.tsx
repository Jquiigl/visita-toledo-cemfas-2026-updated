'use client';
import {useEffect,useState} from 'react';
import {type LanguageCode} from '../data/ui';
import audioData from '../data/audio-scripts.json';

const copy = {
  es:{play:'Escuchar lectura',stop:'Detener',note:'Lectura con la voz disponible en tu dispositivo.',unavailable:'La lectura no está disponible para este idioma en tu dispositivo. Puedes leer la transcripción.'},
  en:{play:'Listen to reading',stop:'Stop',note:'Read with an available voice on your device.',unavailable:'Reading is unavailable for this language on your device. You can read the transcript.'},
  fr:{play:'Écouter la lecture',stop:'Arrêter',note:'Lecture avec une voix disponible sur votre appareil.',unavailable:'La lecture dans cette langue n’est pas disponible sur votre appareil. Vous pouvez lire la transcription.'},
  it:{play:'Ascolta la lettura',stop:'Interrompi',note:'Lettura con una voce disponibile sul dispositivo.',unavailable:'La lettura in questa lingua non è disponibile sul dispositivo. Puoi leggere la trascrizione.'},
  de:{play:'Vorlesen',stop:'Stoppen',note:'Lesen mit einer verfügbaren Stimme auf Ihrem Gerät.',unavailable:'Vorlesen in dieser Sprache ist auf Ihrem Gerät nicht verfügbar. Sie können das Transkript lesen.'},
  ar:{play:'استماع إلى القراءة',stop:'إيقاف',note:'قراءة باستخدام صوت متاح على جهازك.',unavailable:'القراءة بهذه اللغة غير متاحة على جهازك. يمكنك قراءة النص.'},
  ko:{play:'읽기 듣기',stop:'중지',note:'기기에서 사용 가능한 음성으로 읽습니다.',unavailable:'기기에서 이 언어의 음성 읽기를 사용할 수 없습니다. 대본을 읽을 수 있습니다.'}
};

export default function SpokenSummary({language,text}:{language:LanguageCode;text:string}){
  const [playing,setPlaying]=useState(false);
  const [unavailable,setUnavailable]=useState(false);
  useEffect(()=>()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel();},[language,text]);
  const play=()=>{
    if(!('speechSynthesis' in window)){setUnavailable(true);return;}
    const voices=window.speechSynthesis.getVoices();
    const voice=voices.find(v=>v.lang.split(/[-_]/)[0]===language);
    if(!voice){setUnavailable(true);return;}
    window.speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang=audioData.languages[language].locale;utterance.voice=voice;
    utterance.onend=()=>setPlaying(false);utterance.onerror=()=>{setPlaying(false);setUnavailable(true);};
    setUnavailable(false);setPlaying(true);window.speechSynthesis.speak(utterance);
  };
  return <div className="spoken-summary"><button onClick={play} disabled={playing}>{copy[language].play}</button>{playing&&<button onClick={()=>{window.speechSynthesis.cancel();setPlaying(false);}}>{copy[language].stop}</button>}<p role="status">{unavailable?copy[language].unavailable:copy[language].note}</p></div>;
}
