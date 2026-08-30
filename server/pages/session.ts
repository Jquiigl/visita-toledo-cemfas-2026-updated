import {AccessError,configuration,rest,supabase} from './supabase.ts';
import type {PagesEnv,Transport} from './supabase.ts';

export const SESSION_COOKIE='__Host-toledo-updated';
export const IDLE_SECONDS=1800;
type Session={access:string;refresh:string;expires:number;id:string;userId:string;created:number};
const encode=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const decode=(s:string)=>Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
async function key(env:PagesEnv){configuration(env);return crypto.subtle.importKey('raw',Uint8Array.from(env.SESSION_ENCRYPTION_KEY!.match(/../g)!,v=>parseInt(v,16)),{name:'AES-GCM'},false,['encrypt','decrypt']);}
export async function seal(env:PagesEnv,value:Session){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(SESSION_COOKIE)},await key(env),new TextEncoder().encode(JSON.stringify(value)));
  const result=encode(iv)+'.'+encode(new Uint8Array(encrypted));
  if(result.length>3800)throw new AccessError(503,'La sesión excede el tamaño admitido.');
  return result;
}
export async function unseal(env:PagesEnv,cookie:string):Promise<Session|null>{
  const value=cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith(SESSION_COOKIE+'='))?.slice(SESSION_COOKIE.length+1);
  if(!value||value.length>3800)return null;
  try{const [iv,body]=value.split('.');const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(iv),additionalData:new TextEncoder().encode(SESSION_COOKIE)},await key(env),decode(body));const s=JSON.parse(new TextDecoder().decode(plain));
    if(typeof s.access!=='string'||typeof s.refresh!=='string'||typeof s.id!=='string'||typeof s.userId!=='string'||!Number.isFinite(s.created)||!Number.isFinite(s.expires)||Date.now()/1000-s.created>8*3600)return null;return s;
  }catch{return null;}
}
export const cookie=(value:string)=>`${SESSION_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
export const clearCookie=()=>`${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

async function identity(env:PagesEnv,access:string,transport:Transport){
  const r=await supabase(env,'/auth/v1/user',access,{},transport);
  if(!r.ok)throw new AccessError(401,'Sesión no válida. Inicia sesión de nuevo.');
  const user=await r.json() as {id:string};
  const allowed=await rest<boolean>(env,'rpc/is_toledo_admin',access,{method:'POST',body:'{}'},transport);
  if(!allowed)throw new AccessError(403,'Esta cuenta no tiene autorización administrativa.');
  return user;
}
export async function signIn(env:PagesEnv,username:string,password:string,transport:Transport=fetch){
  configuration(env);
  let aliases:Record<string,string>={};try{aliases=JSON.parse(env.ADMIN_LOGIN_ALIASES||'{}');}catch{throw new AccessError(503,'Revisa la configuración del usuario administrador.');}
  const email=username.includes('@')?username:(Object.hasOwn(aliases,username)?aliases[username]:'');
  if(!email||typeof email!=='string')throw new AccessError(401,'Usuario o contraseña incorrectos.');
  const r=await supabase(env,'/auth/v1/token?grant_type=password',undefined,{method:'POST',body:JSON.stringify({email,password})},transport);
  if(!r.ok)throw new AccessError(r.status===429?429:401,r.status===429?'Demasiados intentos. Espera antes de volver a intentarlo.':'Usuario o contraseña incorrectos.');
  const tokens=await r.json() as {access_token:string;refresh_token:string;expires_in:number};
  const user=await identity(env,tokens.access_token,transport);
  const now=Math.floor(Date.now()/1000);
  const s:Session={access:tokens.access_token,refresh:tokens.refresh_token,expires:now+tokens.expires_in,id:crypto.randomUUID(),userId:user.id,created:now};
  await rest(env,'admin_sessions',s.access,{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({id:s.id,user_id:s.userId})},transport);
  return {session:s,header:cookie(await seal(env,s))};
}
export async function authorize(env:PagesEnv,request:Request,transport:Transport=fetch){
  configuration(env);
  const s=await unseal(env,request.headers.get('Cookie')||'');
  if(!s)throw new AccessError(401,'Inicia sesión para acceder.');
  if(s.expires<Date.now()/1000+60){
    const r=await supabase(env,'/auth/v1/token?grant_type=refresh_token',undefined,{method:'POST',body:JSON.stringify({refresh_token:s.refresh})},transport);
    if(!r.ok)throw new AccessError(401,'La sesión ha caducado.');
    const tokens=await r.json() as {access_token:string;refresh_token:string;expires_in:number};
    s.access=tokens.access_token;s.refresh=tokens.refresh_token;s.expires=Math.floor(Date.now()/1000)+tokens.expires_in;
  }
  const user=await identity(env,s.access,transport);
  if(user.id!==s.userId)throw new AccessError(401,'Sesión no válida.');
  // The authoritative EU database invalidates logout/revocation and idle sessions.
  const active=await rest<boolean>(env,'rpc/touch_admin_session',s.access,{method:'POST',body:JSON.stringify({session_id:s.id})},transport);
  if(!active)throw new AccessError(401,'La sesión ha caducado.');
  return {session:s,header:cookie(await seal(env,s))};
}
export async function signOut(env:PagesEnv,s:Session,transport:Transport=fetch){
  await rest(env,'admin_sessions?id=eq.'+encodeURIComponent(s.id),s.access,{method:'DELETE'},transport);
  // DB revocation is authoritative even if the provider logout is unavailable.
  try{await supabase(env,'/auth/v1/logout?scope=local',s.access,{method:'POST'},transport);}catch{/* No tokens or personal data in logs. */}
}
