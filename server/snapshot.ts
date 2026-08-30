import {normalize,review,summarize,statistics} from './domain.ts';
import type {Registration,Evaluation} from './domain.ts';

export function makeSnapshot(registrations:Registration[],evaluations:Evaluation[],inheritTransport:boolean,source:'mock'|'supabase',updated:string){
  const people=normalize(registrations,inheritTransport);
  const issues=review(registrations,people);
  return {source,updated,registrations,people,issues,summary:summarize(registrations,people,issues),evaluations,statistics:statistics(evaluations),settings:{evaluationActive:true,inheritTransport},integrations:{sheets:'Sin sincronizar · formularios externos conservados',ai:'Desactivada · no se envían datos',aiReady:false},authentication:'Supabase Auth · sesión HttpOnly'};
}
export type Snapshot=ReturnType<typeof makeSnapshot>;
