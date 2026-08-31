import {runtime} from './env';
import {getSetting,setSetting} from './db';
import {makeSnapshot} from './snapshot';
import {registrations,evaluations} from './mock';
import {integrationStatus} from './integrations';
export async function snapshot(){
  if(runtime.DATA_SOURCE && runtime.DATA_SOURCE!=='mock')throw new Error('La integración real requiere validar el mapeo de columnas. No se mostrarán datos simulados como datos reales.');
  const inheritTransport=await getSetting('inheritTransport','true')==='true';
  let updated=await getSetting('updated','');if(!updated){updated=new Date().toISOString();await setSetting('updated',updated);}
  return {...makeSnapshot(registrations,evaluations,inheritTransport,'mock',updated),integrations:integrationStatus(),authentication:'Servidor · bcrypt · sesión privada'};
}
