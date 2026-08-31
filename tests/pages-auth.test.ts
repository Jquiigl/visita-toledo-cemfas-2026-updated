import test from 'node:test';
import assert from 'node:assert/strict';
import {handle} from '../server/pages/handler.ts';
import {configuration,supabase,rest,AccessError} from '../server/pages/supabase.ts';
import {allRows} from '../server/pages/data.ts';
import {seal,unseal,cookie} from '../server/pages/session.ts';
import type {PagesEnv,Transport} from '../server/pages/supabase.ts';

// These are deliberately fictitious; this suite makes no external requests.
const env:PagesEnv={SUPABASE_URL:'https://test-project.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test_only',SESSION_ENCRYPTION_KEY:'ab'.repeat(32),ADMIN_LOGIN_ALIASES:'{"test-admin":"admin@example.invalid"}'};
const base='https://toledo.example.invalid';
const assets=async()=>new Response('<html>Solo interfaz, sin datos</html>',{headers:{'Content-Type':'text/html'}});
test('REST acepta 201 sin cuerpo para Prefer return=minimal y conserva JSON cuando existe',async()=>{
  for(const status of [200,201,204]){
    const result=await rest(env,'admin_sessions','test-token',{method:'POST'},async()=>new Response(null,{status}));
    assert.equal(result,null);
  }
  const value=await rest(env,'activities','test-token',{},async()=>Response.json([{id:'test'}],{status:201}));
  assert.deepEqual(value,[{id:'test'}]);
});
test('transporte compatible con Workerd y redirecciones de Supabase cerradas sin reenviar credenciales',async()=>{
  let calls=0;
  for(const status of [301,302,303,307,308]){
    const transport:Transport=async(input,init)=>{
      calls++;assert.equal(String(input),env.SUPABASE_URL+'/auth/v1/token?grant_type=password');
      assert.equal(init?.redirect,'manual');assert.equal(init?.cache,'no-store');
      return new Response(null,{status,headers:{Location:'https://untrusted.example.invalid'}});
    };
    await assert.rejects(supabase(env,'/auth/v1/token?grant_type=password',undefined,{method:'POST',body:'{}'},transport),(error:unknown)=>error instanceof AccessError&&error.status===502&&!error.message.includes('untrusted'));
  }
  assert.equal(calls,5);
});
function fixture(admin=true){
  const sessions=new Set<string>();let calls=0;
  const transport:Transport=async(input,init)=>{
    calls++;const u=new URL(String(input));const headers=new Headers(init?.headers);
    assert.equal(headers.get('apikey'),env.SUPABASE_PUBLISHABLE_KEY);
    if(u.pathname==='/auth/v1/token'){
      const body=JSON.parse(String(init?.body));
      if(body.password!=='test-password')return Response.json({error:'private provider message'},{status:400});
      return Response.json({access_token:'access-not-for-browser',refresh_token:'refresh-not-for-browser',expires_in:3600});
    }
    assert.equal(headers.get('Authorization'),'Bearer access-not-for-browser');
    if(u.pathname==='/auth/v1/user')return Response.json({id:'00000000-0000-4000-8000-000000000001'});
    if(u.pathname==='/rest/v1/rpc/is_toledo_admin')return Response.json(admin);
    if(u.pathname==='/rest/v1/admin_sessions'){
      if(init?.method==='POST')sessions.add(JSON.parse(String(init.body)).id);
      if(init?.method==='DELETE')sessions.delete(u.searchParams.get('id')!.slice(3));
      return new Response(null,{status:init?.method==='POST'?201:204});
    }
    if(u.pathname==='/rest/v1/rpc/touch_admin_session')return Response.json(sessions.has(JSON.parse(String(init?.body)).session_id));
    if(u.pathname==='/auth/v1/logout')return new Response(null,{status:204});
    if(u.pathname==='/rest/v1/activities')return Response.json([{inherit_transport:true,updated_at:'2026-08-31T00:00:00Z'}]);
    if(u.pathname.startsWith('/rest/v1/'))return Response.json([]);
    throw Error('Unexpected endpoint '+u.pathname);
  };
  const request=(path:string,body?:unknown,session='',origin=base)=>handle(new Request(base+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,...(session?{Cookie:session}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)}),env,assets,transport);
  return {request,calls:()=>calls};
}
test('Pages sirve público y login sin Supabase, pero no habilita administrador sin configurar',async()=>{
  assert.equal((await handle(new Request(base+'/'),{},assets)).status,200);
  assert.equal((await handle(new Request(base+'/admin/login'),{},assets)).status,200);
  assert.equal((await handle(new Request(base+'/admin'),{},assets)).status,503);
});
test('todas las rutas administrativas están protegidas en servidor',async()=>{
  const f=fixture();
  for(const p of ['', '/asistentes','/autobus','/vehiculos','/restauracion','/necesidades','/revision','/documentos','/valoracion','/configuracion']){
    const r=await f.request('/admin'+p);assert.equal(r.status,303);assert.equal(r.headers.get('Location'),'/admin/login');
  }
  assert.equal((await f.request('/api/admin/data')).status,401);assert.equal(f.calls(),0);
});
test('Supabase valida password y rol; ni usuario inventado ni autenticado sin rol acceden',async()=>{
  const f=fixture();assert.equal((await f.request('/api/auth/login',{username:'unknown',password:'test-password'})).status,401);
  const wrong=await f.request('/api/auth/login',{username:'test-admin',password:'wrong'});assert.equal(wrong.status,401);assert(!(await wrong.text()).includes('private provider'));
  assert.equal((await fixture(false).request('/api/auth/login',{username:'test-admin',password:'test-password'})).status,403);
});
test('login, API sin tokens en JSON, escritura autorizada, logout y revocación de cookie copiada',async()=>{
  const f=fixture();const login=await f.request('/api/auth/login',{username:'test-admin',password:'test-password'});assert.equal(login.status,200);
  const h=login.headers.get('Set-Cookie')!;assert.match(h,/HttpOnly; Secure; SameSite=Strict/);assert(!h.includes('access-not-for-browser'));
  assert.deepEqual(await login.json(),{ok:true});const c=h.split(';')[0];
  const data=await f.request('/api/admin/data',undefined,c);assert.equal(data.status,200);const d=await data.json() as {source:string;summary:{attendees:number}};assert.equal(d.source,'supabase');assert.equal(d.summary.attendees,0);assert(!JSON.stringify(d).includes('token'));
  assert.equal((await f.request('/api/admin/settings',{inheritTransport:false},c)).status,200);
  const page=await f.request('/admin',undefined,c);assert.equal(page.status,200);assert.match(page.headers.get('Cache-Control')!,/no-store/);
  assert.equal((await f.request('/api/auth/logout',{},c)).status,200);
  assert.equal((await f.request('/api/admin/data',undefined,c)).status,401);
});
test('CSRF, tamaño y tipo de solicitud se rechazan antes del proveedor',async()=>{
  const f=fixture();assert.equal((await f.request('/api/auth/login',{username:'test-admin',password:'test-password'},'','https://evil.invalid')).status,403);
  assert.equal((await f.request('/api/auth/login',{x:'x'.repeat(9000)})).status,413);assert.equal(f.calls(),0);
});
test('configuración rechaza service_role, secretos, URLs no HTTPS y clave débil',()=>{
  assert.throws(()=>configuration({...env,SUPABASE_PUBLISHABLE_KEY:'sb_secret_do_not_use'}));
  assert.throws(()=>configuration({...env,SUPABASE_URL:'http://test-project.supabase.co'}));
  assert.throws(()=>configuration({...env,SESSION_ENCRYPTION_KEY:'short'}));
  assert.throws(()=>configuration({...env,SUPABASE_PUBLISHABLE_KEY:'a.'+btoa(JSON.stringify({role:'service_role'}))+'.b'}));
});
test('análisis requiere sesión, mismo origen y revisión; la preparación no activa el proveedor',async()=>{
  const f=fixture();
  for(const action of ['analysis-preview','analysis-run']){
    assert.equal((await f.request(`/api/admin/${action}`,{kind:'survey'})).status,401);
    assert.equal((await f.request(`/api/admin/${action}`,{kind:'survey'},'','https://evil.invalid')).status,403);
  }
  assert.equal(f.calls(),0);
  const login=await f.request('/api/auth/login',{username:'test-admin',password:'test-password'});
  const c=login.headers.get('Set-Cookie')!.split(';')[0];
  const preview=await f.request('/api/admin/analysis-preview',{kind:'survey'},c);
  assert.equal(preview.status,200);assert.match(preview.headers.get('Cache-Control')!,/no-store/);
  const p=await preview.json() as {fingerprint:string;payload:{analyzed:number}};
  assert.equal(p.fingerprint.length,64);assert.equal(p.payload.analyzed,0);
  assert.equal((await f.request('/api/admin/analysis-run',{kind:'survey',fingerprint:p.fingerprint,reviewed:false},c)).status,400);
  assert.equal((await f.request('/api/admin/analysis-run',{kind:'survey',fingerprint:p.fingerprint,reviewed:true},c)).status,503);
  assert.equal((await f.request('/api/admin/analysis-preview',{kind:'unknown'},c)).status,400);
});
test('cookie cifrada rechaza manipulación y caducidad absoluta',async()=>{
  const s={access:'a',refresh:'r',expires:Date.now()/1000+3600,id:crypto.randomUUID(),userId:crypto.randomUUID(),created:Date.now()/1000};
  const v=await seal(env,s);assert.deepEqual(await unseal(env,cookie(v)),s);
  assert.equal(await unseal(env,cookie('X'+v.slice(1))),null);
  assert.equal(await unseal(env,cookie(await seal(env,{...s,created:s.created-9*3600}))),null);
});
test('lectura paginada evita totales truncados',async()=>{
  let count=0;const fetcher:Transport=async()=>Response.json(Array.from({length:count++===0?500:2},(_,id)=>({id})));
  assert.equal((await allRows(env,'participants?order=id','access',fetcher)).length,502);assert.equal(count,2);
});
