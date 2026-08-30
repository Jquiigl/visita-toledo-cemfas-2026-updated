import { compare } from 'bcryptjs';
import { db } from './db';
import { runtime } from './env';
export const COOKIE = '__Host-toledo-session';
export const IDLE_MS = 30 * 60 * 1000;
const MAX_AGE_MS = 8 * 60 * 60 * 1000;
export const users = (): Record<string,string> => {
  try { const value=JSON.parse(runtime.ADMIN_USERS || '{}'); return Object.fromEntries(Object.entries(value).filter(([k,v])=>k.length<=80 && typeof v==='string' && /^\$2[aby]\$(1[0-6])\$/.test(v))) as Record<string,string>; } catch { return {}; }
};
export async function digest(value:string) { const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join(''); }
export const tokenFrom = (cookie:string) => cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith(`${COOKIE}=`))?.slice(COOKIE.length+1) || '';
export async function session(cookie:string, now=Date.now()) {
  const raw=tokenFrom(cookie); if(!/^[a-f0-9]{64}$/.test(raw))return null;
  const token=await digest(raw);
  const row=await db().prepare('SELECT * FROM sessions WHERE token=?').bind(token).first<{username:string;fingerprint:string;last_seen:number;created:number}>();
  if(!row)return null;
  const hash=users()[row.username];
  if(!hash || row.fingerprint!==await digest(hash) || now-row.last_seen>IDLE_MS || now-row.created>MAX_AGE_MS){await db().prepare('DELETE FROM sessions WHERE token=?').bind(token).run();return null;}
  await db().prepare('UPDATE sessions SET last_seen=? WHERE token=?').bind(now,token).run();
  return {username:row.username};
}
export const sessionCookie=(token:string)=>`${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
export const clearCookie=()=>`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
export async function login(username:string,password:string,now=Date.now()) {
  // Persistent limits; never trust client-supplied forwarded IP headers.
  const key=`account:${await digest(username.toLowerCase())}`;
  await db().prepare('DELETE FROM attempts WHERE expires<=?').bind(now).run();
  await db().prepare('DELETE FROM sessions WHERE last_seen<? OR created<?').bind(now-IDLE_MS,now-MAX_AGE_MS).run();
  const counts=await db().batch<{count:number}>(['global',key].map(k=>db().prepare('INSERT INTO attempts(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(k,now+15*60*1000)));
  if(Number(counts[0].results[0].count)>30 || Number(counts[1].results[0].count)>5)return {status:429,error:'Demasiados intentos. Espera 15 minutos.'};
  const accounts=users();const account=accounts[username];const dummy=Object.values(accounts)[0];
  if(!dummy)return {status:503,error:'El administrador todavía no está configurado.'};
  const valid=await compare(password,account || dummy);
  if(!valid || !account)return {status:401,error:'Usuario o contraseña incorrectos.'};
  const raw=Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
  await db().prepare('INSERT INTO sessions(token,username,fingerprint,last_seen,created) VALUES(?,?,?,?,?)').bind(await digest(raw),username,await digest(account),now,now).run();
  await db().prepare('DELETE FROM attempts WHERE key=?').bind(key).run();
  return {status:200,token:raw};
}
