import {readFileSync,readdirSync,writeFileSync,statSync,existsSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
const root='dist-pages';
// A legacy Vinext build generates an automatic Wrangler redirect. Pages must not
// follow it into the old D1 worker. Remove only that exact generated pointer;
// the legacy build recreates it when needed. No database or source file is removed.
const pointer='.wrangler/deploy/config.json';
if(existsSync(pointer)){
  const config=JSON.parse(readFileSync(pointer,'utf8'));
  if(config.configPath==='../../dist/server/wrangler.json')unlinkSync(pointer);
  else throw Error('Unknown generated Wrangler redirect: review before deploying Pages.');
}
const files=path=>readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(path,e.name)):[join(path,e.name)]);
for(const file of files(root)){
  if(/\/(\.dev\.vars|\.env|_worker\.js)(\.|$)/.test(file))throw Error('Archivo privado o servidor inesperado en Pages: '+file);
  if(statSync(file).size>25*1024*1024)throw Error('El archivo supera el límite de Pages: '+file);
  if(/\.(html|js|json|map)$/.test(file)&&/ADMIN_USERS|GOOGLE_PRIVATE_KEY|OPENAI_API_KEY|SESSION_ENCRYPTION_KEY|SUPABASE_SERVICE_ROLE|BEGIN PRIVATE KEY|Familia Demo Uno|sb_secret_/.test(readFileSync(file,'utf8')))throw Error('Material no público en el frontend: '+file);
}
// Only the protected surface invokes Functions, keeping static visits low-cost.
writeFileSync(join(root,'_routes.json'),JSON.stringify({version:1,include:['/admin','/admin/*','/api/*'],exclude:[]},null,2));
writeFileSync(join(root,'_headers'),`/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self'; connect-src 'self'; frame-src https://www.google.com https://maps.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
/service-worker.js
  Cache-Control: no-cache
`);
console.log('Pages: frontend público verificado; /admin y /api requieren Functions; medios conservados.');
