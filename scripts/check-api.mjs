import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173';
if(!process.env.TEST_ADMIN_PASSWORD)throw new Error('TEST_ADMIN_PASSWORD es obligatoria.');
const request=(path,options={})=>fetch(base+path,{redirect:'manual',...options});
let checks=0;const check=(condition,message)=>{assert(condition,message);checks++;};
for(const route of ['/admin','/admin/asistentes','/admin/inscripciones','/admin/autobus','/admin/vehiculos','/admin/restauracion','/admin/necesidades','/admin/revision','/admin/documentos','/admin/valoracion','/admin/configuracion']){const r=await request(route);check(r.status===307&&r.headers.get('location')?.endsWith('/admin/login'),`Protección ${route}`);}
let r=await request('/api/admin/data');check(r.status===401,'API privada sin cookie');
const post=(path,body,cookie='',origin=base)=>request(path,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
r=await post('/api/auth/login',{username:'organizador',password:'incorrecta'});check(r.status===401,'Rechaza contraseña incorrecta');
r=await post('/api/auth/login',{username:'organizador',password:process.env.TEST_ADMIN_PASSWORD});check(r.status===200,'Login real en servidor');
const cookieHeader=r.headers.get('set-cookie')||'';check(/HttpOnly/.test(cookieHeader)&&/Secure/.test(cookieHeader)&&/SameSite=Strict/.test(cookieHeader),'Atributos de cookie');
const cookie=cookieHeader.split(';')[0];
r=await request('/api/admin/data',{headers:{Cookie:cookie}});check(r.status===200,'API con sesión');const data=await r.json();check(data.summary.attendees===12&&data.summary.bus===9&&data.source==='mock','Datos ficticios y cálculo correcto');
for(const route of ['/admin','/admin/asistentes','/admin/autobus','/admin/vehiculos','/admin/restauracion','/admin/necesidades','/admin/revision','/admin/documentos','/admin/valoracion','/admin/configuracion']){r=await request(route,{headers:{Cookie:cookie}});check(r.status===200,`Ruta autenticada ${route}`);}
r=await post('/api/admin/settings',{evaluationActive:true,inheritTransport:true},cookie,'https://evil.invalid');check(r.status===403,'Bloqueo CSRF');
r=await post('/api/admin/settings',{evaluationActive:true,inheritTransport:true},cookie);check(r.status===200,'Configuración guardada');
r=await request('/api/public/config');const config=await r.json();check(config.evaluationActive===true&&Object.keys(config).length===1,'Zona pública no expone datos privados');
r=await post('/api/admin/settings',{evaluationActive:false,inheritTransport:true},cookie);check(r.status===200,'Compatibilidad con ajustes anteriores');
r=await request('/api/public/config');check((await r.json()).evaluationActive===true,'Un ajuste antiguo no puede ocultar la valoración');
r=await request('/');const publicHtml=await r.text();check(publicHtml.includes('Valorar la actividad')&&publicHtml.includes('28 de octubre de 2026')&&publicHtml.includes('una vez finalizada la actividad'),'Botón y aviso en HTML inicial sin esperar a API ni sesión');
r=await request('/?lang=ar');const arabicHtml=await r.text();check(r.status===200&&arabicHtml.includes('lang="ar" dir="rtl"')&&arabicHtml.includes('تقييم النشاط'),'Árabe en HTML inicial, sin esperar a hidratación');
r=await request('/?lang=invalid');check((await r.text()).includes('lang="es" dir="ltr"'),'Idioma no reconocido vuelve al español');
r=await post('/api/admin/google-check',{},cookie);check(r.status===503,'Google sin credenciales se informa explícitamente');
r=await post('/api/admin/google-check',{});check(r.status===401,'Comprobación Google protegida');
r=await post('/api/admin/ai',{});check(r.status===401,'IA protegida');
r=await post('/api/admin/ai',{},cookie);check(r.status===503,'IA desactivada no bloquea estadísticas');
r=await post('/api/auth/logout',{},cookie);check(r.status===200&&r.headers.get('set-cookie')?.includes('Max-Age=0'),'Logout borra cookie');
r=await request('/api/admin/data',{headers:{Cookie:cookie}});check(r.status===401,'Logout invalida sesión en servidor');
const unknownUser=`security-check-${crypto.randomUUID()}`;
for(let i=0;i<6;i++){r=await post('/api/auth/login',{username:unknownUser,password:'incorrecta'});check(r.status===(i<5?401:429),'Límite persistente de intentos');}
console.log(`${checks} comprobaciones HTTP correctas: rutas, login, cookie segura, CSRF, privacidad, ajustes, logout e intentos.`);
