import test from 'node:test';
import assert from 'node:assert/strict';
import {GoogleReader, GoogleReadError, type SheetRow} from '../server/google-reader.ts';
import {googleSources} from '../server/google-schema.ts';
import {registrationsFromGoogle, evaluationsFromGoogle, extraSurvey} from '../server/google-mapping.ts';
import {makeSnapshot} from '../server/snapshot.ts';
import {analysisPreview} from '../server/analysis-ai.ts';
import {snapshot} from '../server/pages/data.ts';

const credentials = await (async()=>{
  const key = await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
  const bytes = new Uint8Array(await crypto.subtle.exportKey('pkcs8',key.privateKey));
  return {GOOGLE_SERVICE_ACCOUNT_EMAIL:'fixture@fake-project.iam.gserviceaccount.com',GOOGLE_PRIVATE_KEY:`-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...bytes))}\n-----END PRIVATE KEY-----`};
})();
function registration(changes: Record<number,string> = {}): SheetRow {
  const cells=Array<string>(55).fill('');Object.assign(cells,{0:'31/08/2026 12:00:00',1:'Persona Ficticia',4:'SI',5:'SI',7:'NO',37:'NO',40:'Adulto - Normal',47:'No',51:'Confirmación de prueba',52:'Sin acompañantes',53:'Información de prueba',...changes});
  return {rowNumber:2,cells};
}
function evaluation(changes:Record<number,string>={}):SheetRow {
  const cells=Array<string>(16).fill('');Object.assign(cells,{0:'31/08/2026 12:00:00',1:'5',2:'4',3:'3',4:'5',5:'4',6:'5',7:'4',8:'3',9:'Adecuada.',10:'Adecuado.',11:'Texto ficticio',14:'0',15:'SI, Si pero con cambios sustanciales',...changes});return {rowNumber:2,cells};
}
function googleFixture(options:{rows?:SheetRow[];count?:number;headers?:readonly string[];status?:number}={}) {
  const calls:{url:string;init?:RequestInit}[]=[];
  const transport:typeof fetch=async(input,init)=>{
    const url=String(input);calls.push({url,init});assert.equal(init?.redirect,'manual');assert.equal(init?.cache,'no-store');
    if(options.status)return new Response('Provider details must not leak',{status:options.status,headers:{Location:'https://evil.invalid'}});
    if(url==='https://oauth2.googleapis.com/token'){
      const params=new URLSearchParams(String(init?.body));const assertion=params.get('assertion')!;
      const claims=JSON.parse(atob(assertion.split('.')[1].replaceAll('-','+').replaceAll('_','/')));
      assert.equal(claims.scope,'https://www.googleapis.com/auth/spreadsheets.readonly');assert.equal(claims.iss,credentials.GOOGLE_SERVICE_ACCOUNT_EMAIL);assert.equal(claims.exp-claims.iat,3600);
      assert.equal(claims.sub,undefined);assert.equal(params.get('grant_type'),'urn:ietf:params:oauth:grant-type:jwt-bearer');
      return Response.json({access_token:'test-only-access',token_type:'Bearer',expires_in:3600});
    }
    assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer test-only-access');assert.notEqual(init?.method,'POST');
    const source=url.includes(googleSources.registrations.id)?googleSources.registrations:googleSources.evaluations;
    if(!url.includes('/values/'))return Response.json({spreadsheetId:source.id,sheets:[{properties:{sheetId:source.sheetId,title:source.tab,gridProperties:{rowCount:options.count??101,columnCount:61}}}]});
    const range=decodeURIComponent(new URL(url).pathname.split('/values/')[1]);const [,startText,,endText]=range.match(/!A(\d+):([A-Z]+)(\d+)$/)!;const start=Number(startText),end=Number(endText);
    const entries=(options.rows||[]).filter(r=>r.rowNumber>=start&&r.rowNumber<=end);
    const values:string[][]=[];if(start===1)values.push([...(options.headers||source.headers)]);
    for(const row of entries){while(values.length<row.rowNumber-start)values.push([]);values.push(row.cells);}
    return Response.json({range,values});
  };return {transport,calls};
}
test('lectura vacía valida hojas/cabeceras, usa scope lector y un token compartido por solicitud',async()=>{
  const f=googleFixture();const reader=new GoogleReader(credentials,f.transport);
  assert.deepEqual(await Promise.all([reader.read('registrations'),reader.read('evaluations')]),[[],[]]);
  assert.equal(f.calls.filter(c=>c.url==='https://oauth2.googleapis.com/token').length,1);
});
test('lectura por posiciones conserva encabezados repetidos y filas después de huecos',async()=>{
  const f=googleFixture({count:1001,rows:[registration(),{...registration(),rowNumber:1001}]});
  const rows=await new GoogleReader({...credentials,GOOGLE_PRIVATE_KEY:credentials.GOOGLE_PRIVATE_KEY.replaceAll('\n','\\n')+'\\n'},f.transport).read('registrations');
  assert.deepEqual(rows.map(r=>r.rowNumber),[2,1001]);assert.equal(rows[0].cells[1],'Persona Ficticia');
});
test('cabeceras movidas o modificadas y volúmenes excesivos fallan sin totales parciales',async()=>{
  for(const options of [{headers:['wrong']},{count:10001}]){
    const f=googleFixture(options);await assert.rejects(new GoogleReader(credentials,f.transport).read('registrations'),GoogleReadError);
  }
});
test('secretos incorrectos, redirecciones, permisos, límites y cuerpo inválido no se filtran',async()=>{
  for(const env of [{},{...credentials,GOOGLE_PRIVATE_KEY:'PRIVATE-SENTINEL'},{...credentials,GOOGLE_SERVICE_ACCOUNT_EMAIL:'personal@example.invalid'}]){
    const f=googleFixture();await assert.rejects(new GoogleReader(env,f.transport).read('registrations'),e=>e instanceof GoogleReadError&&!e.message.includes('SENTINEL'));assert.equal(f.calls.length,0);
  }
  for(const status of [302,403,429,500]){
    const f=googleFixture({status});await assert.rejects(new GoogleReader(credentials,f.transport).read('registrations'),e=>e instanceof GoogleReadError&&!e.message.includes('Provider details'));assert.equal(f.calls.length,1);
  }
  await assert.rejects(new GoogleReader(credentials,async()=>new Response('invalid-json')).read('registrations'),GoogleReadError);
});
test('cada nombre y menú se asigna a su posición, nunca se deduplica por nombre ni fecha',()=>{
  const row=registration({7:'SI',8:'Persona Ficticia',9:'HIJO/A',10:'MENOR DE EDAD',11:'12',12:'NO',41:'Infantil - Normal'});
  const registrations=registrationsFromGoogle([row,{...row,rowNumber:3}]);const data=makeSnapshot(registrations,[],true,'google','now');
  assert.equal(data.people.length,4);assert.equal(data.summary.bus,4);assert.equal(data.summary.diners,4);assert.equal(data.summary.minors,2);
  assert.equal(registrations[0].companions[0].name,'Persona Ficticia');assert.equal(registrations[0].companions[0].menu,'Infantil - Normal');assert.equal(data.audit.duplicates.length,1);
  assert.equal(makeSnapshot(registrations,[],false,'google','now').summary.bus,2);
});
test('no crea acompañantes por No solicita menú; omite emails/empleo/padrino y conserva vehículo sin adivinar',()=>{
  const mapped=registrationsFromGoogle([registration({4:'NO',5:'NO',6:'Texto vehículo ficticio',40:'No solicita menú',41:'No solicita menú',54:'private@example.invalid',2:'PRIVATE-RANK',3:'PRIVATE-SPONSOR'})])[0];
  assert.equal(mapped.companions.length,0);assert.equal(mapped.holder.meal,false);assert.equal(mapped.vehicle?.original,'Texto vehículo ficticio');assert.equal(mapped.vehicle?.plate,'');assert(!JSON.stringify(mapped).includes('PRIVATE'));assert(!JSON.stringify(mapped).includes('@'));
});
test('tipos críticos ambiguos detienen lectura; errores revisables y menús huérfanos quedan señalados',()=>{
  const cases:Record<number,string>[]=[{4:'maybe'},{5:'unknown'},{40:''},{40:'unmapped'},{7:'SI',8:'Persona',10:'UNKNOWN',41:'No solicita menú'}];
  for(const changes of cases) assert.throws(()=>registrationsFromGoogle([registration(changes)]),GoogleReadError);
  const r=registrationsFromGoogle([registration({7:'SI',8:'',9:'HIJO/A',10:'MENOR DE EDAD',11:'doce',12:'SI',41:'Infantil - Normal',42:'Adulto - Normal'})]);
  const data=makeSnapshot(r,[],true,'google','now');assert(data.audit.errors.some(e=>e.reason.includes('falta nombre')));assert(data.audit.errors.some(e=>e.reason.includes('Edad con formato')));assert(data.audit.errors.some(e=>e.reason.includes('menú asignado')));
});
test('necesidades quedan separadas, exigen consentimiento reconocido y nunca entran al paquete IA',async()=>{
  const consent='Consiento expresamente la información que he facilitado sobre limitaciones y necesidades de movilidad para la gestión de la actividad';
  const row=registration({37:'SI',38:'PRIVATE-HEALTH-TEXT',39:consent});const r=registrationsFromGoogle([row]);
  assert.equal(r[0].groupNeeds?.mobility,'PRIVATE-HEALTH-TEXT');assert.equal(r[0].holder.mobility,undefined);
  const preview=await analysisPreview(makeSnapshot(r,[],true,'google','now'),'registrations');assert(!JSON.stringify(preview.payload).includes('PRIVATE-HEALTH-TEXT'));
  assert.equal(registrationsFromGoogle([registration({37:'SI',38:'PRIVATE-HEALTH-TEXT',39:'no'})])[0].groupNeeds?.mobility,undefined);
});
test('encuesta separa 1–5 de 0–10, categorías y los tres comentarios; mantiene ceros y excluye inválidos',async()=>{
  const evals=evaluationsFromGoogle([evaluation({12:'Mejora ficticia',13:'Propuesta ficticia'}),{...evaluation({1:'1.5',14:'11',9:'PRIVATE-UNKNOWN',15:'No'}),rowNumber:3}]);
  const data=makeSnapshot([],evals,true,'google','now');assert.equal(data.survey.global?.n,1);assert.equal(data.survey.global?.mean,5);assert.equal(data.survey.invalid,1);
  assert.equal(data.extraSurvey.relationship.mean,0);assert.equal(data.extraSurvey.relationship.invalid,1);assert.equal(data.extraSurvey.categories[0].invalid,1);
  assert.equal(data.extraSurvey.categories[2].n,2);assert.equal(data.extraSurvey.categories[2].distribution.reduce((s,d)=>s+d.percent,0),150);
  assert(evals[0].comment.includes('Mejora ficticia'));assert(evals[0].comment.includes('Propuesta ficticia'));assert.equal(Object.keys(evals[0].scores).length,8);
  const packet=(await analysisPreview(data,'survey')).payload;assert(!JSON.stringify(packet).includes('PRIVATE-UNKNOWN'));assert(!JSON.stringify(packet).includes('Propuesta ficticia'));
});
test('extras respetan exclusión de referencias repetidas y no inventan medias vacías',()=>{
  const e=evaluationsFromGoogle([evaluation()])[0];assert.equal(extraSurvey([e,e]).available,false);assert.equal(extraSurvey([]).relationship.mean,null);
});
test('snapshot activado lee las dos hojas sin copiar respuestas ni consultar tablas personales de Supabase',async()=>{
  const f=googleFixture();let writes=0;
  const data=await snapshot({...credentials,GOOGLE_SHEETS_ENABLED:'true',SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',SESSION_ENCRYPTION_KEY:'ab'.repeat(32)},'test',async(input,init)=>{
    if(String(input).includes('supabase.co')){assert(String(input).includes('/activities?'));if(init?.method&&init.method!=='GET')writes++;return Response.json([{inherit_transport:true}]);}return f.transport(input,init);
  });
  assert.equal(data.source,'google');assert.equal(data.summary.attendees,0);assert.equal(data.survey.responses,0);assert.equal(writes,0);assert(!JSON.stringify(data).includes('test-only-access'));
});
