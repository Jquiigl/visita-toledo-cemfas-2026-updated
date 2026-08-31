import {makeSnapshot} from '../snapshot.ts';
import {analysisStatus} from '../analysis-ai.ts';
import type {Person,Registration,Evaluation} from '../domain.ts';
import {AccessError,rest} from './supabase.ts';
import type {PagesEnv,Transport} from './supabase.ts';
import {GoogleReader} from '../google-reader.ts';
import {registrationsFromGoogle,evaluationsFromGoogle} from '../google-mapping.ts';
type Row={id:string;updated_at:string};
type RegistrationRow=Row&{declared_meals:number|null};
type ParticipantRow=Row&{registration_id:string;name:string;role:Person['role'];adult:boolean;age:number|null;transport:Person['transport']|null;meal:boolean;menu_id:string|null;dietary:string;mobility:string};
type VehicleRow=Row&{registration_id:string;model:string;color:string;plate:string;original:string};
type AnswerRow={evaluation_id:string;question_id:string;score:number|null};

// Explicit pagination avoids silently truncating totals at the API row limit.
export async function allRows<T>(env:PagesEnv,table:string,access:string,transport:Transport=fetch):Promise<T[]>{
  const rows:T[]=[];
  for(let offset=0;offset<50000;offset+=500){
    const chunk=await rest<T[]>(env,`${table}${table.includes('?')?'&':'?'}limit=500&offset=${offset}`,access,{},transport);
    rows.push(...chunk);if(chunk.length<500)return rows;
  }
  throw new AccessError(503,'El volumen requiere una consulta paginada ampliada. No se mostrarán totales parciales.');
}
export async function snapshot(env:PagesEnv,access:string,transport:Transport=fetch){
  if(env.GOOGLE_SHEETS_ENABLED==='true'){
    const reader=new GoogleReader(env,transport);
    const [settings,registrationRows,evaluationRows]=await Promise.all([
      rest<{inherit_transport:boolean}[]>(env,'activities?id=eq.toledo-2026&select=inherit_transport,updated_at',access,{},transport),
      reader.read('registrations'),reader.read('evaluations'),
    ]);
    if(settings.length!==1)throw new AccessError(503,'Falta configurar la actividad o sus permisos en Supabase.');
    const data=makeSnapshot(registrationsFromGoogle(registrationRows),evaluationsFromGoogle(evaluationRows),settings[0].inherit_transport,'google',new Date().toISOString());
    return {...data,integrations:{...data.integrations,...analysisStatus(env)}};
  }
  const [settings,registrations,participants,vehicles,menus,evaluations,questions,answers]=await Promise.all([
    rest<{inherit_transport:boolean;updated_at:string}[]>(env,'activities?id=eq.toledo-2026&select=inherit_transport,updated_at',access,{},transport),
    allRows<RegistrationRow>(env,'registrations?activity_id=eq.toledo-2026&status=eq.active&order=id',access,transport),
    allRows<ParticipantRow>(env,'participants?order=id',access,transport),
    allRows<VehicleRow>(env,'vehicles?order=id',access,transport),
    allRows<Row&{label:string}>(env,'menus?activity_id=eq.toledo-2026&order=id',access,transport),
    allRows<Row&{comment:string}>(env,'evaluations?activity_id=eq.toledo-2026&order=id',access,transport),
    allRows<Row&{label:string}>(env,'survey_questions?activity_id=eq.toledo-2026&order=id',access,transport),
    allRows<AnswerRow>(env,'evaluation_answers?order=evaluation_id,question_id',access,transport),
  ]);
  if(settings.length!==1)throw new AccessError(503,'Falta configurar la actividad o sus permisos en Supabase.');
  const menuNames=new Map(menus.map(m=>[m.id,m.label]));
  const person=(p:ParticipantRow):Person=>({id:p.id,name:p.name,role:p.role,adult:p.adult,age:p.age??undefined,transport:p.transport??undefined,meal:p.meal,menu:p.menu_id?menuNames.get(p.menu_id)||'':'',dietary:p.dietary,mobility:p.mobility});
  const mapped:Registration[]=registrations.map(r=>{
    const group=participants.filter(p=>p.registration_id===r.id);
    const holders=group.filter(p=>p.role==='Titular');
    if(holders.length!==1)throw new AccessError(409,'Hay una inscripción sin titular válido. Revisa la importación antes de calcular totales.');
    const v=vehicles.find(v=>v.registration_id===r.id);
    return {id:r.id,holder:person(holders[0]),companions:group.filter(p=>p.role==='Acompañante').map(person),declaredMeals:r.declared_meals??undefined,vehicle:v?{model:v.model,color:v.color,plate:v.plate,original:v.original}:undefined};
  });
  const questionNames=new Map(questions.map(q=>[q.id,q.label]));
  const results:Evaluation[]=evaluations.map(e=>({id:e.id,comment:e.comment,scores:Object.fromEntries(answers.filter(a=>a.evaluation_id===e.id&&questionNames.has(a.question_id)).map(a=>[questionNames.get(a.question_id)!,a.score]))}));
  const data=makeSnapshot(mapped,results,settings[0].inherit_transport,'supabase',new Date().toISOString());
  return {...data,integrations:{...data.integrations,...analysisStatus(env)}};
}
