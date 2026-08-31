import {AccessError,rest} from './supabase.ts';
import type {PagesEnv,Transport} from './supabase.ts';
import {authorize,clearCookie,signIn,signOut} from './session.ts';
import {snapshot} from './data.ts';
import {AnalysisError,analysisKind,analysisPreview,runAnalysis} from '../analysis-ai.ts';

const json=(value:unknown,status=200)=>Response.json(value,{status});
function secure(r:Response,sessionCookie?:string){
  const h=new Headers(r.headers);
  h.set('Cache-Control','private, no-store, max-age=0');h.set('CDN-Cache-Control','no-store');h.set('Vary','Cookie');
  h.set('X-Content-Type-Options','nosniff');h.set('X-Frame-Options','DENY');h.set('Referrer-Policy','no-referrer');
  h.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  if(sessionCookie)h.set('Set-Cookie',sessionCookie);
  return new Response(r.body,{status:r.status,headers:h});
}
async function body(request:Request,maxBytes=8192):Promise<Record<string,unknown>>{
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new AccessError(415,'Se requiere JSON.');
  if(Number(request.headers.get('Content-Length')||0)>maxBytes)throw new AccessError(413,'Solicitud demasiado grande.');
  // Stream bound also covers clients without Content-Length.
  const reader=request.body?.getReader();const chunks:Uint8Array[]=[];let size=0;
  if(reader){while(true){const item=await reader.read();if(item.done)break;size+=item.value.byteLength;if(size>maxBytes){await reader.cancel();throw new AccessError(413,'Solicitud demasiado grande.');}chunks.push(item.value);}}
  const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
  try{const v=JSON.parse(new TextDecoder().decode(bytes));if(!v||Array.isArray(v)||typeof v!=='object')throw Error();return v;}catch{throw new AccessError(400,'Solicitud no válida.');}
}
export async function handle(request:Request,env:PagesEnv,assets:()=>Promise<Response>,transport:Transport=fetch){
  const url=new URL(request.url);const path=url.pathname.replace(/\/+$/,'')||'/';
  const admin=path==='/admin'||path.startsWith('/admin/');
  const api=path.startsWith('/api/');
  if(!admin&&!api)return assets();
  try{
    if(url.protocol!=='https:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw new AccessError(403,'El acceso administrativo requiere HTTPS.');
    if(!['GET','POST','HEAD'].includes(request.method))return secure(json({error:'Método no permitido.'},405));
    if(request.method==='POST'&&request.headers.get('Origin')!==url.origin)throw new AccessError(403,'Origen de solicitud no autorizado.');
    if(path==='/api/public/config'&&request.method==='GET')return secure(json({evaluationActive:true}));
    if(path==='/admin/login'&&['GET','HEAD'].includes(request.method))return secure(await assets());
    if(path==='/api/auth/login'&&request.method==='POST'){
      const b=await body(request);
      if(typeof b.username!=='string'||typeof b.password!=='string'||!b.username.trim()||b.username.length>254||!b.password||b.password.length>1024)throw new AccessError(400,'Introduce usuario y contraseña válidos.');
      const signed=await signIn(env,b.username.trim(),b.password,transport);
      return secure(json({ok:true}),signed.header);
    }
    const auth=await authorize(env,request,transport);
    if(admin&&['GET','HEAD'].includes(request.method))return secure(await assets(),auth.header);
    if(path==='/api/auth/logout'&&request.method==='POST'){
      await signOut(env,auth.session,transport);return secure(json({ok:true}),clearCookie());
    }
    if(path==='/api/admin/data'&&request.method==='GET'||path==='/api/admin/refresh'&&request.method==='POST')return secure(json(await snapshot(env,auth.session.access,transport)),auth.header);
    if(path==='/api/admin/settings'&&request.method==='POST'){
      const b=await body(request);if(typeof b.inheritTransport!=='boolean')throw new AccessError(400,'Configuración no válida.');
      await rest(env,'activities?id=eq.toledo-2026',auth.session.access,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({inherit_transport:b.inheritTransport})},transport);
      return secure(json(await snapshot(env,auth.session.access,transport)),auth.header);
    }
    if(['/api/admin/analysis-preview','/api/admin/analysis-run'].includes(path)&&request.method==='POST'){
      const b=await body(request,path.endsWith('analysis-run')?32768:8192);
      const kind=analysisKind(b.kind);
      const data=await snapshot(env,auth.session.access,transport);
      const result=path.endsWith('analysis-preview')?await analysisPreview(data,kind):await runAnalysis(data,b,env,auth.session.userId,transport);
      return secure(json(result),auth.header);
    }
    if(['/api/admin/ai','/api/admin/google-check'].includes(path))throw new AccessError(503,'Utiliza el nuevo panel de análisis. La sincronización de Google sigue pendiente. No se han enviado datos.');
    return secure(json({error:'Ruta no encontrada.'},404),auth.header);
  }catch(e){
    const status=e instanceof AccessError||e instanceof AnalysisError?e.status:503;
    const message=e instanceof AccessError||e instanceof AnalysisError?e.message:'No se pudo conectar con el servicio seguro. No se mostrarán datos ficticios como reales.';
    if(admin&&status===401)return secure(new Response(null,{status:303,headers:{Location:'/admin/login'}}),clearCookie());
    return secure(json({error:message},status),status===401?clearCookie():undefined);
  }
}
