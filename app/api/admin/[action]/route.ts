import {guard,body,json} from '../../../../server/http';
import {snapshot} from '../../../../server/data';
import {setSetting} from '../../../../server/db';
import {runtime} from '../../../../server/env';
import {checkGoogleAccess,integrationStatus} from '../../../../server/integrations';
import {openAIService} from '../../../../server/adapters/openai';

type Context={params:Promise<{action:string}>};
export async function GET(request:Request,{params}:Context){
  const denied=await guard(request);if(denied)return denied;
  const {action}=await params;
  if(action!=='data')return json({error:'No encontrado'},404);
  try{return json(await snapshot());}catch{return json({error:'No se pudieron cargar los datos. Revisa la configuración del origen.'},503);}
}
export async function POST(request:Request,{params}:Context){
  const denied=await guard(request);if(denied)return denied;
  const {action}=await params;
  try{
    if(action==='refresh'){await snapshot();await setSetting('updated',new Date().toISOString());return json(await snapshot());}
    if(action==='settings'){
      const data=await body(request);
      if(typeof data?.inheritTransport!=='boolean')return json({error:'Configuración no válida.'},400);
      await setSetting('inheritTransport',String(data.inheritTransport));
      return json(await snapshot());
    }
    if(action==='google-check'){
      if(!runtime.GOOGLE_SERVICE_ACCOUNT_EMAIL||!runtime.GOOGLE_PRIVATE_KEY)return json({error:'Faltan las credenciales de Google en el servidor. No se ha consultado ninguna hoja.'},503);
      return json(await checkGoogleAccess());
    }
    if(action==='ai'){
      if(!integrationStatus().aiReady)return json({error:'Falta configurar la clave y el modelo de OpenAI en el servidor. No se han enviado comentarios.'},503);
      const data=await body(request);
      if(data?.reviewed!==true||!Array.isArray(data.comments)||data.comments.length===0||data.comments.length>40||data.comments.some((c:unknown)=>typeof c!=='string'||!c.trim())||data.comments.join('\n').length>6000)return json({error:'Revisa el texto y confirma que no contiene datos personales. Máximo: 40 comentarios y 6000 caracteres.'},400);
      try{return json(await openAIService({apiKey:runtime.OPENAI_API_KEY,model:runtime.OPENAI_MODEL}).analyzeComments({comments:data.comments,reviewed:true}));}
      catch(error){return json({error:error instanceof Error?error.message:'No se pudo completar el análisis.'},502);}
    }
    return json({error:'No encontrado'},404);
  }catch{return json({error:'La operación no pudo completarse. No se han modificado las fuentes.'},503);}
}
