// Server-only, read-only Google Sheets adapter. Nothing here is imported by public UI.
import type {Registration,Person,Evaluation} from '../domain';
export type GoogleConfig={email:string;privateKey:string;registrationSheetId:string;evaluationSheetId:string;registrationRange:string;evaluationRange:string};
const encode=(s:string)=>btoa(s).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
export class GoogleSheetsAdapter {
  private token?:{value:string;expires:number};
  constructor(private config:GoogleConfig,private transport:typeof fetch=fetch){if(!config.email||!config.privateKey||!config.registrationSheetId||!config.evaluationSheetId)throw new Error('Faltan credenciales o identificadores de las hojas.');}
  private async accessToken(){
    if(this.token&&Date.now()<this.token.expires)return this.token.value;
    const now=Math.floor(Date.now()/1000);const header=encode(JSON.stringify({alg:'RS256',typ:'JWT'}));const claims=encode(JSON.stringify({iss:this.config.email,scope:'https://www.googleapis.com/auth/spreadsheets.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
    const pem=this.config.privateKey.replaceAll('\\n','\n').replace(/-----[^-]+-----|\s/g,'');const bytes=Uint8Array.from(atob(pem),c=>c.charCodeAt(0));const key=await crypto.subtle.importKey('pkcs8',bytes,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
    const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(`${header}.${claims}`));const assertion=`${header}.${claims}.${encode(String.fromCharCode(...new Uint8Array(signature)))}`;
    const response=await this.transport('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error('Google no ha autorizado el acceso. Revisa la cuenta de servicio.');const result=await response.json() as {access_token:string;expires_in:number};if(!result.access_token)throw new Error('Respuesta de autenticación no válida.');this.token={value:result.access_token,expires:Date.now()+(result.expires_in-60)*1000};return result.access_token;
  }
  async read(source:'registrations'|'evaluations'):Promise<Record<string,string>[]>{const id=source==='registrations'?this.config.registrationSheetId:this.config.evaluationSheetId;const range=source==='registrations'?this.config.registrationRange:this.config.evaluationRange;if(!range)throw new Error('Falta el rango de lectura.');const response=await this.transport(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}`,{headers:{Authorization:`Bearer ${await this.accessToken()}`},signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('No se ha podido leer la hoja. La última copia válida debe conservarse.');const result=await response.json() as {values?:string[][]};const [headers=[],...rows]=result.values||[];if(new Set(headers).size!==headers.length)throw new Error('Cabeceras duplicadas: se necesita un mapeo por posición validado.');return rows.map(row=>Object.fromEntries(headers.map((h,i)=>[h,String(row[i]??'')])));}
}
export type PersonColumns={name:string;adult:string;age?:string;transport?:string;meal:string;menu:string;dietary?:string;mobility?:string};
export type ColumnMapping={id:string;holder:PersonColumns;companions:PersonColumns[];vehicleOriginal?:string};
// Strict mapping: unknown values stop import instead of silently undercounting people.
export function mapRegistrations(rows:Record<string,string>[],mapping:ColumnMapping):Registration[]{
  const seen=new Set<string>();
  const yesNo=(value:string)=>{const v=value.trim().toLowerCase();if(['sí','si','yes'].includes(v))return true;if(['no'].includes(v))return false;throw new Error(`Valor sí/no no reconocido: ${value}`);};
  return rows.map(row=>{const id=row[mapping.id];if(!id||seen.has(id))throw new Error('Identificador de inscripción ausente o duplicado.');seen.add(id);
    const person=(c:PersonColumns,index:number):Person=>{const adultValue=(row[c.adult]||'').trim().toLowerCase();if(!['adulto','menor'].includes(adultValue))throw new Error('Clasificación adulto/menor no reconocida.');const t=c.transport?row[c.transport]?.trim().toLowerCase():'';if(t&&!['autobús','autobus','vehículo','vehiculo'].includes(t))throw new Error('Transporte no reconocido.');const ageText=c.age?row[c.age]?.trim():'';if(ageText&&!/^\d{1,3}$/.test(ageText))throw new Error('Edad no reconocida.');return {id:`${id}:${index}`,name:row[c.name]||'',role:index===0?'Titular':'Acompañante',adult:adultValue==='adulto',age:ageText?Number(ageText):undefined,transport:t?(t.startsWith('auto')?'bus':'car'):undefined,meal:yesNo(row[c.meal]||''),menu:row[c.menu]||'',dietary:c.dietary?row[c.dietary]:undefined,mobility:c.mobility?row[c.mobility]:undefined};};
    const original=mapping.vehicleOriginal?row[mapping.vehicleOriginal]:'';
    return {id,holder:person(mapping.holder,0),companions:mapping.companions.flatMap((c,i)=>Object.values(c).some(header=>Boolean(row[header]?.trim()))?[person(c,i+1)]:[]),...(original?{vehicle:{original,model:'',color:'',plate:''}}:{})};
  });
}
export function mapEvaluations(rows:Record<string,string>[],mapping:{id:string;comment:string;questions:Record<string,string>}):Evaluation[]{return rows.map(row=>({id:row[mapping.id],comment:row[mapping.comment]||'',scores:Object.fromEntries(Object.entries(mapping.questions).map(([question,column])=>{const text=row[column]?.trim();if(!text)return [question,null];const score=Number(text);if(!Number.isFinite(score)||score<1||score>5)throw new Error('Escala de valoración no reconocida.');return [question,score];}))}));}
