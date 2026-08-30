import {runtime} from './env';
import {getSetting,setSetting} from './db';
import {normalize,review,summarize,statistics} from './domain';
import {registrations,evaluations} from './mock';
export async function snapshot(){
  if(runtime.DATA_SOURCE && runtime.DATA_SOURCE!=='mock')throw new Error('La integración real requiere validar el mapeo de columnas. No se mostrarán datos simulados como datos reales.');
  const people=normalize(registrations,await getSetting('inheritTransport','true')==='true');const issues=review(registrations,people);
  let updated=await getSetting('updated','');if(!updated){updated=new Date().toISOString();await setSetting('updated',updated);}
  return {source:'mock',updated,registrations,people,issues,summary:summarize(registrations,people,issues),evaluations,statistics:statistics(evaluations),settings:{evaluationActive:await getSetting('evaluationActive','false')==='true',inheritTransport:await getSetting('inheritTransport','true')==='true'},integrations:{sheets:'Sin conectar · datos ficticios',ai:'No configurada'}};
}
