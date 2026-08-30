import {existsSync,unlinkSync,readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
// Cloudflare copies local development variables into its generated output.
// Remove only these generated copies, never the local source configuration.
for(const path of ['dist/server/.dev.vars','dist/server/ssr/.dev.vars'])if(existsSync(path))unlinkSync(path);
function files(path){return readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(path,e.name)):[join(path,e.name)]);}
for(const path of files('dist')){
  if(/\/(\.dev\.vars|\.env)(\.|$)/.test(path))throw new Error(`Unexpected environment file in build: ${path}`);
  if(path.startsWith('dist/client/')&&/\.(js|html)$/.test(path)){
    const text=readFileSync(path,'utf8');
    if(/ADMIN_USERS|GOOGLE_PRIVATE_KEY|OPENAI_API_KEY|BEGIN PRIVATE KEY|Familia Demo Uno/.test(text))throw new Error(`Server-only material in client build: ${path}`);
  }
}
console.log('Paquete verificado: sin archivos de secretos ni datos privados en el cliente.');
