import {googleSources} from './google-schema.ts';
import {GoogleReadError} from './google-reader.ts';
export const headerKey = (v:string) => v.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const aliases:Record<string,string[]> = {
  [headerKey(googleSources.registrations.headers[47])]: ['NECESIDAD ALIMENTARIA ESPECIAL'],
  [headerKey(googleSources.registrations.headers[48])]: ['INDIQUE LA PERSONA Y DETALLE LA ALERGIA, INTOLERANCIA U OTRA NECESIDAD ALIMENTARIA'],
};
export function columnIndexes(source:keyof typeof googleSources, headers:readonly string[]) {
  const keys=headers.map(headerKey); const used=new Map<string,number>();
  return googleSources[source].headers.map(label=>{
    const key=headerKey(label); const candidates=[key,...(aliases[key]||[]).map(headerKey)];
    const occurrence=used.get(key)||0; used.set(key,occurrence+1);
    const matches=keys.flatMap((k,i)=>candidates.includes(k)?[i]:[]);
    if(matches.length!==googleSources[source].headers.filter(h=>headerKey(h)===key).length)
      throw new GoogleReadError(409, `Cabecera ausente o ambigua: ${label}. Revisa el formulario; no se mostrarán totales parciales.`);
    return matches[occurrence];
  });
}
export function validateHeaders(source:keyof typeof googleSources,headers:readonly string[]) {columnIndexes(source,headers);}
export function courseColumn(headers:readonly string[],course:'PRIMER'|'SEGUNDO',index:number) {
  const person=index?`Acompañante ${index}`:'Titular';
  const key=headerKey(`${course} PLATO — MENÚ GENERAL (MENÚ 6) — POR PERSONA [${person}]`);
  const matches=headers.flatMap((h,i)=>headerKey(h)===key?[i]:[]);
  if(matches.length>1) throw new GoogleReadError(409,'Cabecera de plato duplicada. Revisa el formulario.');
  return matches[0];
}
