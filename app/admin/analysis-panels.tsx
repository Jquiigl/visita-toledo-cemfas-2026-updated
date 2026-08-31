'use client';
import {useState} from 'react';
import type {Snapshot} from '../../server/snapshot';
import type {AnalysisKind, AnalysisReport, analysisPreview} from '../../server/analysis-ai';
import {safeCsv} from '../../server/domain';
import type {Report} from './responsive';
import './analysis.css';

type Data = Omit<Snapshot, 'authentication'>;
type Preview = Awaited<ReturnType<typeof analysisPreview>>;
type Result = {report: AnalysisReport; generatedAt: string; model: string; source: string; fingerprint: string};
function saveText(name: string, text: string, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], {type}));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
}
async function request<T>(action: string, payload: unknown): Promise<T> {
  const response = await fetch(`/api/admin/${action}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)});
  if (response.status === 401) {window.location.assign('/admin/login'); throw new Error('La sesión ha caducado.');}
  const value = await response.json() as T & {error?: string};
  if (!response.ok) throw new Error(value.error || 'No se pudo completar el análisis.');
  return value;
}

function AnalysisAssistant({kind, ready, hasData}: {kind: AnalysisKind; ready: boolean; hasData: boolean}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [draft, setDraft] = useState(''); const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [result, setResult] = useState<Result | null>(null);
  const comments = draft.split('\n').map(c => c.trim()).filter(Boolean);
  const edit = (text: string) => {setDraft(text); setReviewed(false); setResult(null);};
  async function prepare() {
    setBusy(true); setError(''); setResult(null); setReviewed(false); setPreview(null); setDraft('');
    try {setPreview(await request<Preview>('analysis-preview', {kind}));} catch(e) {setError((e as Error).message);} finally {setBusy(false);}
  }
  async function generate() {
    if (!preview) return;
    setBusy(true); setError(''); setResult(null);
    try {setResult(await request<Result>('analysis-run', {kind, fingerprint: preview.fingerprint, comments, reviewed})); setReviewed(false);}
    catch(e) {setError((e as Error).message); setReviewed(false);} finally {setBusy(false);}
  }
  const titles = {strengths: 'Fortalezas', concerns: 'Aspectos que revisar', recommendations: 'Propuestas de mejora', limitations: 'Límites del análisis'};
  const reportText = result ? ['TOLEDO UPDATED · INTERPRETACIÓN MEDIANTE IA', `Fuente: ${result.source} · Generado: ${result.generatedAt} · Modelo: ${result.model}`, `Huella de los datos revisados: ${result.fingerprint}`, 'Borrador pendiente de revisión humana. No confirma duplicados ni modifica datos.', result.report.summary,
    ...Object.entries(titles).flatMap(([key, title]) => [title, ...result.report[key as keyof typeof titles].map(s => `- ${s}`)])].join('\n\n') : '';
  return <article className="admin-card admin-ai">
    <span className="admin-eyebrow">INTERPRETACIÓN MEDIANTE IA · OPCIONAL</span>
    <h2>{kind === 'registrations' ? 'Ayuda para priorizar la revisión' : 'Informe de la encuesta con IA'}</h2>
    <p>{kind === 'registrations' ? 'La detección de coincidencias se realiza dentro de la aplicación. La IA recibe alertas resumidas y códigos de caso, nunca los nombres ni las fichas personales. No puede confirmar identidades.' : 'La IA interpreta las cifras calculadas por la aplicación. Puedes añadir comentarios después de revisarlos; por defecto no se envía ninguno.'}</p>
    {!ready && <p className="admin-notice" role="status">IA sin activar. Faltan la clave de proyecto, el modelo y la activación en el servidor. Los controles y gráficos funcionan sin IA.</p>}
    <p className="admin-muted">Cada análisis autorizado puede generar un coste en OpenAI. No hay envíos ni reintentos automáticos. No se guarda el informe en esta aplicación; descárgalo si quieres conservarlo.</p>
    <p className="admin-muted">El análisis utiliza las cifras de toda la actividad, no los filtros de la pantalla. Solo se añaden los comentarios que revises en este bloque.</p>
    <button disabled={!hasData || busy} onClick={prepare}>{busy ? 'Procesando…' : '1. Preparar datos para revisar · sin envío a OpenAI'}</button>
    {!hasData && <p>Todavía no hay datos reales cargados para este análisis.</p>}
    {preview && <div className="analysis-preview">
      <h3>Datos que se enviarán</h3>
      <p>Este resumen se obtiene del servidor. No se enviará el fichero original ni los datos personales de inscripción. Revisa también los límites y casos omitidos indicados aquí.</p>
      <p>{preview.payload.kind === 'registrations' ? `${preview.payload.registrations} inscripciones, ${preview.payload.people} personas y ${preview.payload.totalDuplicateCases} casos de posible duplicidad. Se enviarán ${preview.payload.duplicateCases.length} casos resumidos; ${preview.payload.omittedCases} quedan fuera del informe de IA.` : `${preview.payload.analyzed} respuestas analizadas, ${preview.payload.questions.length} preguntas y ${comments.length} comentarios revisados para este envío.`}</p>
      <details><summary>Ver el paquete completo de cifras y alertas</summary><pre>{JSON.stringify(preview.payload, null, 2)}</pre></details>
      {kind === 'survey' && <>
        <p>{preview.totalComments} comentarios disponibles. Puedes interpretar solo las cifras o añadir hasta 40 comentarios revisados.</p>
        <button disabled={busy || !preview.suggestedComments.length} onClick={() => edit(preview.suggestedComments.join('\n'))}>Preparar los primeros {preview.suggestedComments.length} comentarios para revisar</button>
        {preview.totalComments > 40 && <p className="admin-muted">La propuesta inicial incluye únicamente los primeros 40; no es una selección representativa garantizada. Puedes sustituirlos o eliminarlos.</p>}
        <label className="ai-draft-label">Comentarios que autorizas a enviar, uno por línea<textarea value={draft} rows={8} disabled={busy} onChange={e => edit(e.target.value)}/></label>
        <p>{comments.length}/40 comentarios · {draft.length}/6000 caracteres</p>
        <p className="admin-muted">La ocultación automática es solo una ayuda. Retira nombres, correos, teléfonos, matrículas, datos de menores, salud o cualquier detalle identificativo. Deja el campo vacío para enviar solo las cifras.</p>
      </>}
      <label className="admin-check"><input type="checkbox" checked={reviewed} disabled={busy} onChange={e => setReviewed(e.target.checked)}/>He revisado el paquete y los comentarios, he retirado la información personal y autorizo enviarlos a OpenAI para este análisis, con su posible coste.</label>
      <button disabled={!ready || !reviewed || busy || comments.length > 40 || draft.length > 6000} onClick={generate}>{busy ? 'Analizando…' : '2. Enviar datos revisados y generar informe'}</button>
    </div>}
    {error && <p role="alert" className="admin-error">{error}</p>}
    {result && <section className="analysis-result" aria-live="polite">
      <h3>Interpretación mediante IA · borrador</h3><p className="admin-muted">{new Date(result.generatedAt).toLocaleString('es-ES')} · {result.model} · {result.source === 'mock' ? 'DATOS FICTICIOS' : 'Datos de Supabase'}</p>
      <p>{result.report.summary}</p>{Object.entries(titles).map(([key, title]) => <section key={key}><h3>{title}</h3><ul>{result.report[key as keyof typeof titles].map((text, i) => <li key={i}>{text}</li>)}</ul></section>)}
      <p className="admin-muted">Revisa este texto antes de compartirlo. Puede contener errores y no sustituye las cifras ni la revisión de los registros originales.</p>
      <button onClick={() => saveText(`toledo-${kind}-informe-ia.txt`, reportText)}>Descargar informe de IA en texto</button>
    </section>}
  </article>;
}

export function RegistrationReview({data}: {data: Data}) {
  const [filter, setFilter] = useState('all'); const [search, setSearch] = useState('');
  const audit = data.audit; const query = search.toLocaleLowerCase('es');
  const cases = audit.duplicates.filter(d => d.people.some(p => `${p.name} ${p.registrationId}`.toLocaleLowerCase('es').includes(query)));
  const errors = audit.errors.filter(e => `${e.person} ${e.registrationId} ${e.reason}`.toLocaleLowerCase('es').includes(query));
  function exportReview() {
    const rows = [['Tipo', 'Caso', 'Inscripción', 'Persona', 'Motivo'], ...(filter !== 'errors' ? cases.flatMap(d => d.people.map(p => ['Posible duplicado', d.id, p.registrationId, p.name, d.reason])) : []), ...(filter !== 'duplicates' ? errors.map(e => ['Dato a revisar', '', e.registrationId, e.person, e.reason]) : [])];
    saveText('toledo-revision-privada.csv', safeCsv(rows), 'text/csv;charset=utf-8');
  }
  return <>
    <div className="admin-metrics"><article className="primary-metric"><span>Inscripciones que revisar</span><strong>{audit.affectedRegistrations}</strong><small>No se han borrado ni corregido registros</small></article><article><span>Grupos con nombres coincidentes</span><strong>{audit.duplicates.filter(d => d.kind === 'coincidente').length}</strong><small>Posibles homónimos, no duplicados confirmados</small></article><article><span>Parecidos que comprobar</span><strong>{audit.duplicates.filter(d => d.kind === 'parecido').length}</strong><small>Variaciones de una letra</small></article><article><span>Datos incoherentes o incompletos</span><strong>{audit.errors.length}</strong><small>Avisos, no personas distintas</small></article></div>
    <article className="admin-card"><h2>Revisión de inscripciones</h2><p>Estas comprobaciones no requieren IA ni envían nombres fuera de la aplicación. Confirma cada caso con la inscripción original; dos personas pueden llamarse igual. No se validan documentos de identidad ni datos que no se hayan importado.</p>
      {audit.partial && <p role="alert" className="admin-error">La búsqueda de nombres parecidos es parcial por el volumen o la longitud de los datos. Las coincidencias exactas sí se han revisado; no interpretes la ausencia de avisos como validación completa.</p>}
      <div className="admin-filters"><label>Buscar persona o inscripción<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre, referencia o motivo"/></label><label>Mostrar<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todos los avisos</option><option value="duplicates">Posibles duplicados</option><option value="errors">Datos incoherentes</option></select></label></div>
      <button onClick={exportReview} disabled={!(filter !== 'errors' && cases.length || filter !== 'duplicates' && errors.length)}>Exportar avisos filtrados · CSV privado</button>
      <p className="admin-muted">La exportación contiene nombres y referencias. Compártela solo con personal autorizado.</p>
    </article>
    {filter !== 'errors' && cases.map(d => <article className="admin-card" key={d.id}>
      <span className="admin-eyebrow">{d.id} · POSIBLE DUPLICADO · {d.kind === 'coincidente' ? 'NOMBRE COINCIDENTE' : 'NOMBRE PARECIDO'}</span><h2>Comparar {d.people.length} registros</h2><p>{d.reason}</p>
      <p>{d.sameRegistration ? 'Dentro de la misma inscripción.' : 'En inscripciones diferentes.'} {d.ageConflict && 'Las edades o categorías de edad difieren: podrían ser personas distintas.'} {d.transportConflict && 'Hay diferencias de transporte.'} {d.mealConflict && 'Hay diferencias de asistencia a la comida.'}</p>
      <ul className="analysis-people">{d.people.map((p, i) => <li key={i}><strong>{p.name}</strong><span>{p.role} · {p.adult ? 'Adulto' : 'Menor'} · {p.registrationId}</span><a href={`/admin/inscripciones?q=${encodeURIComponent(p.registrationId)}`}>Abrir inscripción →</a></li>)}</ul>
    </article>)}
    {filter !== 'duplicates' && errors.length > 0 && <article className="admin-card"><h2>Datos que requieren comprobación</h2>{errors.map((e, i) => <a className="admin-issue" key={i} href={`/admin/inscripciones?q=${encodeURIComponent(e.registrationId)}`}><b>!</b><div><strong>{e.reason}</strong><small>{e.person} · {e.registrationId}</small></div><span>Revisar →</span></a>)}</article>}
    {!(filter !== 'errors' && cases.length || filter !== 'duplicates' && errors.length) && <p role="status" className="admin-empty">{data.people.length ? 'No hay avisos con estos filtros. Esto no garantiza que todos los datos sean correctos.' : 'Todavía no hay inscripciones cargadas.'}</p>}
    <AnalysisAssistant key={data.updated} kind="registrations" ready={data.integrations.aiReady} hasData={data.people.length > 0}/>
  </>;
}

export function SurveyPanel({data, onPrint}: {data: Data; onPrint: (reports: Report[]) => void}) {
  const [query, setQuery] = useState(''); const survey = data.survey;
  const comments = survey.comments.filter(e => e.comment.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')));
  const report: Report = {title: 'Encuesta · resultados calculados sin IA', headers: ['Pregunta', 'N válido', 'Media / 5', 'Mediana', 'Favorables 4–5 (%)', 'Sin respuesta', 'No válidas'], rows: survey.questions.map(q => [q.question, String(q.n), q.mean?.toFixed(2) ?? '—', String(q.median ?? '—'), q.favorablePercent?.toFixed(1) ?? '—', String(q.missing), String(q.invalid)])};
  const text = ['TOLEDO UPDATED · ENCUESTA · RESULTADOS SIN IA', `Fuente: ${data.source} · Actualización: ${data.updated}`, survey.summary, `Registros excluidos por referencia repetida: ${survey.excluded}. Puntuaciones no válidas: ${survey.invalid}.`, ...report.rows.map(r => r.map((v, i) => `${report.headers[i]}: ${v}`).join(' · '))].join('\n\n');
  return <>
    <div className="admin-metrics"><article className="primary-metric"><span>Respuestas analizadas</span><strong>{survey.responses}</strong><small>{survey.received} recibidas · {survey.excluded} excluidas</small></article><article><span>Valoración global</span><strong>{survey.global?.mean?.toFixed(2) ?? '—'}<em>/ 5</em></strong><small>N válido: {survey.global?.n ?? 0}</small></article><article><span>Valoraciones globales favorables</span><strong>{survey.global?.favorablePercent?.toFixed(0) ?? '—'}<em>%</em></strong><small>4 o 5 puntos · no es tasa de participación</small></article><article><span>Comentarios disponibles</span><strong>{survey.comments.length}</strong><small>No se envían a la IA automáticamente</small></article></div>
    <article className="admin-card"><span className="admin-eyebrow">LECTURA OBJETIVA · SIN IA</span><h2>Resumen de los resultados</h2><p>{survey.summary}</p>
      {!!survey.excluded && <p role="alert" className="admin-error">{survey.excluded} registros excluidos del análisis por compartir una referencia de respuesta. Hay que revisar el origen; no se ha borrado ninguno.</p>}
      {!!survey.invalid && <p role="alert" className="admin-error">{survey.invalid} puntuaciones fuera de la escala entera 1–5. Se excluyen de medias y porcentajes, pero se conservan los originales.</p>}
      {survey.best && <p>Mayor media observada: <strong>{survey.best.question}</strong> ({survey.best.mean!.toFixed(2)}/5; N={survey.best.n}). {survey.improvement && <>Menor media observada: <strong>{survey.improvement.question}</strong> ({survey.improvement.mean!.toFixed(2)}/5; N={survey.improvement.n}).</>} La comparación es descriptiva, no prueba diferencias significativas.</p>}
      <div className="admin-actions"><button disabled={!survey.responses} onClick={() => saveText('toledo-encuesta-resumen.txt', text)}>Descargar resumen en texto</button><button disabled={!survey.responses} onClick={() => saveText('toledo-encuesta-resultados.csv', safeCsv([report.headers, ...report.rows]), 'text/csv;charset=utf-8')}>Exportar resultados CSV</button><button disabled={!survey.responses} onClick={() => onPrint([report])}>Resultados / PDF</button></div>
    </article>
    {!!survey.questions.length && <article className="admin-card"><h2>Comparativa por pregunta</h2><p>Medias sobre 5. Consulta el número de respuestas de cada pregunta.</p>{survey.questions.map(q => <div className="survey-comparison" key={q.code}><span>{q.code} · {q.question}</span><meter min={0} max={5} value={q.mean ?? 0} aria-label={`${q.question}: ${q.mean?.toFixed(2) ?? 'sin datos'} sobre 5`}/><strong>{q.mean?.toFixed(2) ?? '—'} <small>N={q.n}</small></strong></div>)}</article>}
    <div className="admin-two">{survey.questions.map(q => <article className="admin-card" key={q.code}><span className="admin-eyebrow">{q.code} · DISTRIBUCIÓN DE RESPUESTAS</span><h2>{q.question}</h2><p>N={q.n} · Media={q.mean?.toFixed(2) ?? '—'} · Mediana={q.median ?? '—'}</p>{q.distribution.map(d => <div className="admin-bar" key={d.score}><span>{d.score} ★</span><meter min={0} max={100} value={d.percent} aria-label={`${d.score} puntos: ${d.count} respuestas; ${d.percent.toFixed(1)} por ciento`}/><small>{d.count} · {d.percent.toFixed(0)}%</small></div>)}<p className="admin-muted">Sin respuesta: {q.missing} · No válidas: {q.invalid}. Porcentajes sobre las respuestas válidas a esta pregunta.</p></article>)}</div>
    <article className="admin-card"><h2>Comentarios originales · solo administración</h2><label className="admin-search">Buscar comentarios<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar texto"/></label><p>{comments.length} comentarios con esta búsqueda</p>{comments.map(e => <blockquote key={e.id}>{e.comment}</blockquote>)}
      <div className="admin-actions"><button disabled={!comments.length} onClick={() => saveText('toledo-comentarios-privados.csv', safeCsv([['Referencia', 'Comentario original'], ...comments.map(e => [e.id, e.comment])]), 'text/csv;charset=utf-8')}>Exportar comentarios filtrados · CSV privado</button><button disabled={!comments.length} onClick={() => onPrint([{title: 'Comentarios originales · uso restringido', headers: ['Referencia', 'Comentario'], rows: comments.map(e => [e.id, e.comment])}])}>Comentarios filtrados / PDF</button></div>
    </article>
    <AnalysisAssistant key={data.updated} kind="survey" ready={data.integrations.aiReady} hasData={survey.responses > 0}/>
  </>;
}
