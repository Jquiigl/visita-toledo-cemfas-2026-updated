import {session} from './auth';
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin;}
export const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
export async function guard(request:Request){if(!await session(request.headers.get('cookie')||''))return json({error:'La sesión ha caducado. Inicia sesión.'},401);if(request.method!=='GET'&&!sameOrigin(request))return json({error:'Origen no permitido.'},403);return null;}
export async function body(request:Request){if(!request.headers.get('content-type')?.startsWith('application/json'))throw new Error('Formato incorrecto.');const raw=await request.text();if(raw.length>8192)throw new Error('Solicitud demasiado grande.');return JSON.parse(raw);}
