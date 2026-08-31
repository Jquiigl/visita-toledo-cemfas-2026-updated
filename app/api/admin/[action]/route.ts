import {guard,body,json} from '../../../../server/http';
import {snapshot} from '../../../../server/data';
import {setSetting} from '../../../../server/db';
import {runtime} from '../../../../server/env';
import {checkGoogleAccess} from '../../../../server/integrations';
import {AnalysisError,analysisKind,analysisPreview,runAnalysis} from '../../../../server/analysis-ai';

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
    if(action==='analysis-preview'||action==='analysis-run'){
      const input=await body(request);
      const kind=analysisKind(input?.kind);
      const data=await snapshot();
      return json(action==='analysis-preview'?await analysisPreview(data,kind):await runAnalysis(data,input,runtime,'legacy-admin'));
    }
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
    if(action==='ai')return json({error:'Utiliza el nuevo panel de análisis con vista previa y revisión de datos.'},409);
    return json({error:'No encontrado'},404);
  }catch(error){return error instanceof AnalysisError?json({error:error.message},error.status):json({error:'La operación no pudo completarse. No se han modificado las fuentes.'},503);}
}
