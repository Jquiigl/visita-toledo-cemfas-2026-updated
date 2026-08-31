export type PagesEnv={SUPABASE_URL?:string;SUPABASE_PUBLISHABLE_KEY?:string;SESSION_ENCRYPTION_KEY?:string;ADMIN_LOGIN_ALIASES?:string;OPENAI_API_KEY?:string;OPENAI_MODEL?:string;OPENAI_ENABLED?:string;GOOGLE_SERVICE_ACCOUNT_EMAIL?:string;GOOGLE_PRIVATE_KEY?:string;GOOGLE_SHEETS_ENABLED?:string};
export type Transport=typeof fetch;
export class AccessError extends Error{constructor(public status:number,message:string){super(message);}}
export function configuration(env:PagesEnv){
  if(!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY||!env.SESSION_ENCRYPTION_KEY)throw new AccessError(503,'Falta configurar el acceso seguro de Supabase.');
  const url=new URL(env.SUPABASE_URL);
  if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co')||url.pathname!=='/'||url.search||url.username||url.password)throw new AccessError(503,'Revisa la URL del proyecto Supabase.');
  const key=env.SUPABASE_PUBLISHABLE_KEY;
  // Only the publishable key or legacy anon JWT is allowed: never bypass RLS.
  let legacyAnon=false;
  try{legacyAnon=JSON.parse(atob(key.split('.')[1].replaceAll('-','+').replaceAll('_','/'))).role==='anon';}catch{/* Not a legacy JWT. */}
  if(!key.startsWith('sb_publishable_')&&!legacyAnon)throw new AccessError(503,'Usa una clave publishable, nunca una clave secreta o service_role.');
  if(!/^[a-f0-9]{64}$/i.test(env.SESSION_ENCRYPTION_KEY))throw new AccessError(503,'Falta una clave de sesión aleatoria de 32 bytes.');
  return {url:url.origin,key};
}
export async function supabase(env:PagesEnv,path:string,token?:string,init:RequestInit={},transport:Transport=fetch):Promise<Response>{
  const c=configuration(env);
  const headers=new Headers(init.headers);headers.set('apikey',c.key);
  if(token)headers.set('Authorization',`Bearer ${token}`);
  if(init.body)headers.set('Content-Type','application/json');
  // Workerd supports follow/manual, not redirect:'error'. Never follow a redirect
  // carrying an API key, password or user JWT to a different destination.
  const response=await transport(c.url+path,{...init,headers,redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(response.status>=300&&response.status<400){
    await response.body?.cancel();
    throw new AccessError(502,'El servicio seguro devolvió una redirección no permitida.');
  }
  return response;
}
export async function rest<T>(env:PagesEnv,path:string,token:string,init:RequestInit={},transport:Transport=fetch):Promise<T>{
  const r=await supabase(env,'/rest/v1/'+path,token,init,transport);
  if(!r.ok)throw new AccessError(r.status===401?401:r.status===403?403:502,'No se pudo completar la operación autorizada en Supabase.');
  // PostgREST INSERT with Prefer:return=minimal succeeds with 201 and an empty
  // body, not only 204. Do not mistake a successful session insert for a failure.
  const body=await r.text();
  return (body.trim()?JSON.parse(body):null) as T;
}
