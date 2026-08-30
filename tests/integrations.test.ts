import test from 'node:test';
import assert from 'node:assert/strict';
import {openAIService} from '../server/adapters/openai.ts';
import {GoogleSheetsAdapter} from '../server/adapters/sheets.ts';
import {evaluationCopy,evaluationDeadline,evaluationFormUrl} from '../data/evaluation.ts';

test('la valoración tiene aviso y fecha límite en los siete idiomas',()=>{
  assert.equal(evaluationDeadline,'2026-10-28');
  assert.equal(Object.keys(evaluationCopy).length,7);
  assert(evaluationFormUrl.startsWith('https://forms.gle/'));
  for(const text of Object.values(evaluationCopy)){assert(text.button);assert(text.notice);assert(text.deadline.includes('28'));assert(text.deadline.includes('2026'));}
});

test('OpenAI no envía datos sin configuración o revisión y rechaza información sensible',async()=>{
  let calls=0;
  const transport:typeof fetch=async()=>{calls++;return Response.json({});};
  const input={comments:['La guía fue clara.'],reviewed:true as const};
  await assert.rejects(()=>openAIService({},transport).analyzeComments(input),/Falta configurar/);
  const service=openAIService({apiKey:'test-only',model:'test-model'},transport);
  await assert.rejects(()=>service.analyzeComments({...input,reviewed:false as unknown as true}),/revisión humana/);
  await assert.rejects(()=>service.analyzeComments({comments:['Correo persona@example.test'],reviewed:true}),/sensible/);
  await assert.rejects(()=>service.analyzeComments({comments:['x'.repeat(6001)],reviewed:true}),/6000/);
  assert.equal(calls,0);
});

test('OpenAI usa exclusivamente el texto revisado y recoge todos los mensajes de texto',async()=>{
  const transport:typeof fetch=async(url,init)=>{
    assert.equal(url,'https://api.openai.com/v1/responses');
    assert.equal(init?.method,'POST');
    assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer test-only');
    const body=JSON.parse(String(init?.body));
    assert.equal(body.model,'test-model');assert.equal(body.store,false);assert.equal(body.max_output_tokens,1800);
    assert.deepEqual(JSON.parse(body.input),{comentarios_revisados:['La guía fue clara.']});
    assert(!('tools' in body));
    return Response.json({status:'completed',output:[{type:'reasoning'},{type:'message',content:[{type:'output_text',text:'Fortalezas.'}]},{type:'message',content:[{type:'output_text',text:'Mejoras.'}]}]});
  };
  assert.deepEqual(await openAIService({apiKey:'test-only',model:'test-model'},transport).analyzeComments({comments:['La guía fue clara.'],reviewed:true}),{label:'Interpretación mediante IA',text:'Fortalezas.\nMejoras.'});
});

test('OpenAI no expone errores del proveedor ni resultados incompletos',async()=>{
  const config={apiKey:'test-only',model:'test-model'};
  const input={comments:['Todo bien.'],reviewed:true as const};
  await assert.rejects(()=>openAIService(config,async()=>Response.json({error:'secret-in-provider-error'},{status:401})).analyzeComments(input),error=>error instanceof Error&&!error.message.includes('secret-in-provider-error'));
  await assert.rejects(()=>openAIService(config,async()=>Response.json({status:'incomplete',output:[]})).analyzeComments(input),/completo/);
});

test('Google comprueba solo metadatos con scope de lectura y reutiliza el token',async()=>{
  const key=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
  const privateKey=Buffer.from(await crypto.subtle.exportKey('pkcs8',key.privateKey)).toString('base64');
  let tokens=0;const paths:string[]=[];
  const transport:typeof fetch=async(url,init)=>{
    paths.push(String(url));
    if(String(url).includes('oauth2.googleapis.com')){
      tokens++;
      const assertion=new URLSearchParams(String(init?.body)).get('assertion')!;
      const claims=JSON.parse(Buffer.from(assertion.split('.')[1],'base64url').toString());
      assert.equal(claims.scope,'https://www.googleapis.com/auth/spreadsheets.readonly');
      return Response.json({access_token:'test-token',expires_in:3600});
    }
    assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer test-token');
    assert(String(url).endsWith('?fields=spreadsheetId'));assert.notEqual(init?.method,'POST');
    return Response.json({spreadsheetId:String(url).includes('/registrations?')?'registrations':'evaluations'});
  };
  const adapter=new GoogleSheetsAdapter({email:'test@example.test',privateKey,registrationSheetId:'registrations',evaluationSheetId:'evaluations',registrationRange:'A1:Z10',evaluationRange:'A1:J10'},transport);
  await adapter.checkAccess('registrations');await adapter.checkAccess('evaluations');
  assert.equal(tokens,1);assert.equal(paths.length,3);assert(paths.every(p=>!p.includes('/values/')));
});

test('Google no inicia autenticación si falta el identificador solicitado',async()=>{
  let calls=0;
  const adapter=new GoogleSheetsAdapter({email:'test@example.test',privateKey:'not-a-real-key',registrationSheetId:'',evaluationSheetId:'',registrationRange:'',evaluationRange:''},async()=>{calls++;return Response.json({});});
  await assert.rejects(()=>adapter.checkAccess('evaluations'),/identificador/);assert.equal(calls,0);
});
