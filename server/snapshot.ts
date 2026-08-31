import {normalize,summarize} from './domain.ts';
import {registrationAudit,surveyDashboard} from './analysis.ts';
import type {Registration,Evaluation} from './domain.ts';

export function makeSnapshot(registrations:Registration[],evaluations:Evaluation[],inheritTransport:boolean,source:'mock'|'supabase',updated:string){
  const people=normalize(registrations,inheritTransport);
  const audit=registrationAudit(registrations,inheritTransport);
  const survey=surveyDashboard(evaluations);
  const issues=audit.issues;
  return {source,updated,registrations,people,issues,audit,survey,summary:summarize(registrations,people,issues),evaluations,statistics:survey.questions,settings:{evaluationActive:true,inheritTransport},integrations:{sheets:'Sin sincronizar · formularios externos conservados',ai:'Desactivada · no se envían datos',aiReady:false},authentication:'Supabase Auth · sesión HttpOnly'};
}
export type Snapshot=ReturnType<typeof makeSnapshot>;
