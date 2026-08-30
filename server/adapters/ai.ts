export type ReviewedComments={comments:string[];reviewed:true};
export type AIResult={label:'Interpretación mediante IA';text:string};
export interface AIService {analyzeComments(input:ReviewedComments):Promise<AIResult>;generateRecommendations(input:ReviewedComments):Promise<AIResult>;generateSummary(input:ReviewedComments):Promise<AIResult>;}
export class DisabledAIService implements AIService {
  async analyzeComments(input:ReviewedComments):Promise<AIResult>{void input;throw new Error('IA no configurada. No se han enviado datos.');}
  generateRecommendations(input:ReviewedComments){return this.analyzeComments(input);}
  generateSummary(input:ReviewedComments){return this.analyzeComments(input);}
}
// This is an aid for human review, never a guarantee of anonymization.
export function prepareReview(comments:string[],knownIdentifiers:string[]){return comments.map(text=>{let clean=text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[correo]').replace(/\+?\d[\d\s().-]{7,}\d/g,'[número]').replace(/\b\d{4}\s?[A-Z]{3}\b/gi,'[matrícula]');for(const id of knownIdentifiers.filter(Boolean).sort((a,b)=>b.length-a.length)){clean=clean.replace(new RegExp(id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),'[identificador]');}return {original:text,proposed:clean,requiresHumanReview:true as const};});}
// Provider-independent, injected transport. A future vendor adapter owns credentials,
// endpoint, model and response validation. No network call occurs by default.
export class OptionalAIService implements AIService {
  constructor(private send:(action:string,comments:string[])=>Promise<string>){}
  private async run(action:string,input:ReviewedComments):Promise<AIResult>{if(input.reviewed!==true)throw new Error('Es obligatoria la revisión humana previa.');if(input.comments.some(c=>/alerg|intoleran|movilidad|diagnóst|discapaci|@|\b\d{4}\s?[A-Z]{3}\b/i.test(c)))throw new Error('Posible información sensible: excluye el comentario antes de enviarlo.');const text=await this.send(action,input.comments);return {label:'Interpretación mediante IA',text};}
  analyzeComments(input:ReviewedComments){return this.run('analyzeComments',input);}
  generateRecommendations(input:ReviewedComments){return this.run('generateRecommendations',input);}
  generateSummary(input:ReviewedComments){return this.run('generateSummary',input);}
}
