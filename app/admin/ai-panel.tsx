'use client';
import {useState} from 'react';
import {prepareReview} from '../../server/adapters/ai';

export function AIReviewPanel({comments,identifiers,ready}:{comments:string[];identifiers:string[];ready:boolean}){
  const [draft,setDraft]=useState('');
  const [reviewed,setReviewed]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [result,setResult]=useState('');
  const lines=draft.split('\n').map(c=>c.trim()).filter(Boolean);
  async function send(){
    setBusy(true);setError('');setResult('');
    try{
      const response=await fetch('/api/admin/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({comments:lines,reviewed})});
      if(response.status===401){window.location.assign('/admin/login');return;}
      const value=await response.json() as {error?:string;text?:string};
      if(!response.ok)throw new Error(value.error||'No se completó el análisis.');
      setResult(value.text||'');
    }catch(e){setError(e instanceof Error?e.message:'No se pudo conectar.');}
    finally{setBusy(false);}
  }
  return <article className="admin-card admin-ai"><span className="admin-eyebrow">ANÁLISIS MEDIANTE IA · OPCIONAL</span><h2>Revisa antes de enviar.</h2>
    <p>Solo se enviará a OpenAI el texto que revises aquí. Las estadísticas se calculan sin IA. Cada envío puede generar un coste en tu cuenta de API.</p>
    {!ready&&<p role="status">Sin conectar: falta configurar la clave y el modelo de OpenAI en el servidor.</p>}
    <button disabled={busy||!comments.length} onClick={()=>{setDraft(prepareReview(comments,identifiers).map(c=>c.proposed).join('\n'));setReviewed(false);setResult('');}}>Preparar borrador para revisar · sin envío</button>
    <label className="ai-draft-label">Comentarios que se enviarán (uno por línea)<textarea rows={8} value={draft} maxLength={6000} disabled={busy} onChange={e=>{setDraft(e.target.value);setReviewed(false);setResult('');}}/></label>
    <p className="admin-muted">La ocultación automática no garantiza el anonimato. Elimina nombres, correos, matrículas, datos de menores, salud o cualquier detalle que permita identificar a alguien. Máximo 40 comentarios y 6000 caracteres.</p>
    <label className="admin-check"><input type="checkbox" checked={reviewed} disabled={busy} onChange={e=>setReviewed(e.target.checked)}/>He revisado el texto, eliminado la información personal y autorizo su envío a OpenAI.</label>
    <button disabled={!ready||!reviewed||!lines.length||lines.length>40||busy} onClick={send}>{busy?'Analizando…':'Enviar texto revisado y analizar'}</button>
    {error&&<p role="alert" className="admin-error">{error}</p>}
    {result&&<section aria-live="polite"><h3>Interpretación mediante IA</h3><p className="ai-result">{result}</p><small>Revisa las conclusiones antes de utilizarlas. No sustituyen los resultados estadísticos.</small></section>}
  </article>;
}
