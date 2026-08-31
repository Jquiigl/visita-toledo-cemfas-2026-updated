import {runtime} from './env';
import {GoogleSheetsAdapter} from './adapters/sheets';
import {analysisStatus} from './analysis-ai';

export function integrationStatus(){
  return {
    sheets:runtime.GOOGLE_SERVICE_ACCOUNT_EMAIL&&runtime.GOOGLE_PRIVATE_KEY?'Credenciales configuradas · comprobar acceso y mapeo':'Sin conectar · faltan credenciales de Google',
    ...analysisStatus(runtime),
  };
}

// Probe metadata only, never import answers or infer a valid column mapping.
export async function checkGoogleAccess(){
  const adapter=new GoogleSheetsAdapter({email:runtime.GOOGLE_SERVICE_ACCOUNT_EMAIL||'',privateKey:runtime.GOOGLE_PRIVATE_KEY||'',registrationSheetId:runtime.REGISTRATION_SHEET_ID||'',evaluationSheetId:runtime.EVALUATION_SHEET_ID||'',registrationRange:runtime.REGISTRATION_RANGE||'',evaluationRange:runtime.EVALUATION_RANGE||''});
  const results=await Promise.all((['registrations','evaluations'] as const).map(async source=>{
    try{await adapter.checkAccess(source);return {source,readable:true,message:'Acceso de lectura comprobado. Mapeo de respuestas aún pendiente.'};}
    catch{return {source,readable:false,message:'Sin acceso confirmado: revisar identificador, credenciales y permiso de lector.'};}
  }));
  return {results};
}
