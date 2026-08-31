import test from 'node:test';
import assert from 'node:assert/strict';
import {registrationAudit, normalizedName, surveyDashboard} from '../server/analysis.ts';
import {makeSnapshot} from '../server/snapshot.ts';
import {analysisPreview, analysisStatus, runAnalysis, consumeAnalysisAttempt, parseAnalysisReport} from '../server/analysis-ai.ts';
import type {Registration, Evaluation} from '../server/domain.ts';

const registration = (id: string, name: string): Registration => ({id, holder: {id: `P-${id}`, name, role: 'Titular', adult: true, age: 40, transport: 'bus', meal: true, menu: 'Menú privado'}, companions: []});
const regs = [registration('private-reg-1', 'María García López'), registration('private-reg-2', 'Maria Lopez Garcia'), registration('private-reg-3', 'Marai Garcia Lopez'), registration('private-reg-4', 'Carlos García López')];
const evaluations: Evaluation[] = [
  {id: 'E1', scores: {Global: 5, Recorrido: 4}, comment: 'La guía fue clara.'},
  {id: 'E2', scores: {Global: 4, Recorrido: null}, comment: ''},
  {id: 'E3', scores: {Global: 1, Recorrido: 2.5}, comment: 'Mejoraría las pausas.'},
  {id: 'E4', scores: {Global: null, Recorrido: 0}, comment: ''},
];
const snapshot = () => makeSnapshot(structuredClone(regs), structuredClone(evaluations), true, 'mock', '2026-08-31T00:00:00Z');
const config = {OPENAI_API_KEY: 'test-only-not-real', OPENAI_MODEL: 'test-model', OPENAI_ENABLED: 'true'};
const report = {summary: 'Borrador con datos ficticios.', strengths: ['Guía clara.'], concerns: ['Revisar coincidencias.'], recommendations: ['Comprobar el origen.'], limitations: ['Muestra limitada.']};
const response = () => Response.json({status: 'completed', output: [{type: 'message', content: [{type: 'output_text', text: JSON.stringify(report)}]}]});

test('detecta variantes de tildes, espacios y orden sin confirmar identidades', () => {
  assert.equal(normalizedName('  LÓPEZ, María García '), normalizedName('Maria Garcia Lopez'));
  const audit = registrationAudit(regs);
  assert.equal(audit.duplicates.filter(d => d.kind === 'coincidente').length, 1);
  assert.equal(audit.duplicates.filter(d => d.kind === 'parecido').length, 1);
  assert.equal(audit.duplicates[0].people.length, 2);
  assert(!audit.duplicates.some(d => d.people.some(p => p.name.startsWith('Carlos'))));
  assert.equal(audit.affectedRegistrations, 3); assert.equal(audit.partial, false);
  assert.match(audit.duplicates[0].reason, /homónimos/);
});
test('compara dentro de la misma inscripción y señala contradicciones, sin mutar el origen', () => {
  const r = registration('R1', 'Lucía Pérez García');
  r.companions.push({...r.holder, id: 'other', role: 'Acompañante', adult: false, age: 10, transport: 'car', meal: false, menu: ''});
  const before = JSON.stringify(r); const d = registrationAudit([r]).duplicates[0];
  assert(d.sameRegistration && d.ageConflict && d.transportConflict && d.mealConflict);
  assert.equal(JSON.stringify(r), before);
});
test('nombres árabes y coreanos no se convierten en claves vacías ni coinciden solo por estar en otro idioma', () => {
  assert(normalizedName('김 민수')); assert(normalizedName('أحمد محمد'));
  assert.equal(registrationAudit([registration('1', '김 민수'), registration('2', '박 지훈')]).duplicates.length, 0);
});
test('datos incompletos, edad decimal y nombre numérico requieren comprobación', () => {
  const r = registration('R1', '1234'); r.holder.age = 19.5; r.holder.transport = undefined; r.holder.menu = '';
  const audit = registrationAudit([r]);
  for (const fragment of ['entero', 'Nombre sin letras', 'Transporte sin determinar', 'Comensal sin menú']) assert(audit.errors.some(e => e.reason.includes(fragment)));
});
test('los límites de búsqueda se declaran como revisión parcial, sin descartar coincidencias exactas', () => {
  const data = Array.from({length: 500}, (_, i) => registration(String(i), `Participante ejemplo ${i}`));
  data.push(registration('copy', 'Participante ejemplo 0'));
  const audit = registrationAudit(data); assert(audit.partial); assert(audit.duplicates.some(d => d.kind === 'coincidente'));
});
test('dashboard separa respuestas válidas, ausentes y fuera de escala; porcentajes usan su N', () => {
  const d = surveyDashboard(evaluations);
  assert.equal(d.responses, 4); assert.equal(d.comments.length, 2); assert.equal(d.invalid, 2);
  assert.equal(d.global?.n, 3); assert.equal(d.global?.mean, 10 / 3); assert(Math.abs(d.global!.favorablePercent! - 200 / 3) < 1e-10);
  const route = d.questions.find(q => q.question === 'Recorrido')!;
  assert.equal(route.n, 1); assert.equal(route.missing, 1); assert.equal(route.invalid, 2);
  assert.equal(route.distribution.reduce((n, x) => n + x.percent, 0), 100);
  assert.match(d.summary, /no se calcula sin un censo/);
});
test('referencias repetidas se excluyen sin elegir arbitrariamente una respuesta ni borrar datos', () => {
  const e = [...evaluations, {...evaluations[0], scores: {Global: 1}}]; const before = JSON.stringify(e);
  const d = surveyDashboard(e); assert.equal(d.excluded, 2); assert.deepEqual(d.duplicateIds, ['E1']);
  assert.equal(d.responses, 3); assert.equal(JSON.stringify(e), before);
});
test('vacío, todas las puntuaciones inválidas y muestra de uno no inventan una media', () => {
  assert.equal(surveyDashboard([]).global, null);
  const d = surveyDashboard([{id: 'E1', scores: {Global: NaN}, comment: ''}]);
  assert.equal(d.global?.mean, null); assert.equal(d.global?.favorablePercent, null); assert.equal(d.best, null);
  assert.equal(surveyDashboard([{id: 'E2', scores: {Global: 5}, comment: ''}]).global?.median, 5);
});
test('preparar inscripciones no incluye nombres, referencias, edades, menús o necesidades privadas', async () => {
  const data = snapshot(); data.registrations[0].holder.dietary = 'dato-sensible-alergia';
  const p = await analysisPreview(data, 'registrations'); const text = JSON.stringify(p.payload);
  for (const value of ['María', 'García', 'private-reg', 'Menú privado', 'dato-sensible', 'holderName', 'registrationId']) assert(!text.includes(value), value);
  assert.equal(p.suggestedComments.length, 0); assert.equal(p.fingerprint.length, 64);
});
test('preview de encuesta minimiza preguntas no catalogadas y no envía comentarios por defecto', async () => {
  const data = snapshot(); data.survey.questions[0].question = 'Pregunta con nombre de María García López';
  const p = await analysisPreview(data, 'survey'); assert(!JSON.stringify(p.payload).includes('María'));
  assert(!JSON.stringify(p.payload).includes('La guía')); assert.equal(p.suggestedComments.length, 2);
});
test('activar exige clave, modelo y opción explícita; preparar no llama a la API', () => {
  assert(!analysisStatus({}).aiReady); assert(!analysisStatus({...config, OPENAI_ENABLED: 'false'}).aiReady);
  assert(!analysisStatus({...config, OPENAI_MODEL: ''}).aiReady); assert(analysisStatus(config).aiReady);
});
test('sin consentimiento, con datos cambiados, sin clave o sin datos no hay llamada externa', async () => {
  const data = snapshot(); const p = await analysisPreview(data, 'survey'); let calls = 0;
  const transport: typeof fetch = async () => {calls++; return response();};
  const req = {kind: 'survey', fingerprint: p.fingerprint, reviewed: true, comments: []};
  await assert.rejects(runAnalysis(data, {...req, reviewed: false}, config, 'deny', transport), /autoriza/);
  await assert.rejects(runAnalysis(data, {...req, fingerprint: 'old'}, config, 'deny', transport), /han cambiado/);
  await assert.rejects(runAnalysis(data, req, {}, 'deny', transport), /no está activado/);
  const empty = makeSnapshot([], [], true, 'mock', 'now'); const pe = await analysisPreview(empty, 'survey');
  await assert.rejects(runAnalysis(empty, {...req, fingerprint: pe.fingerprint}, config, 'deny', transport), /no hay datos/);
  assert.equal(calls, 0);
});
test('rechaza comentarios identificativos/sensibles y exceso de tamaño antes de llamar al proveedor', async () => {
  const data = snapshot(); const p = await analysisPreview(data, 'survey'); let calls = 0;
  const transport: typeof fetch = async () => {calls++; return response();};
  for (const comments of [['persona@example.test'], ['teléfono 612345678'], ['1234 ABC'], ['María García López fue a la visita'], ['alergia'], ['x'.repeat(6001)], Array(41).fill('Texto')])
    await assert.rejects(runAnalysis(data, {kind: 'survey', fingerprint: p.fingerprint, reviewed: true, comments}, config, 'private', transport));
  assert.equal(calls, 0);
});
test('informe estructurado usa cifras del servidor, sin herramientas, sin almacenamiento y sin seguir redirecciones', async () => {
  const data = snapshot(); const p = await analysisPreview(data, 'survey');
  const transport: typeof fetch = async (url, init) => {
    assert.equal(url, 'https://api.openai.com/v1/responses'); assert.equal(init?.redirect, 'manual');
    const b = JSON.parse(String(init?.body)); assert.equal(b.store, false); assert.equal(b.max_output_tokens, 2400);
    assert.equal(b.text.format.type, 'json_schema'); assert.equal(b.text.format.strict, true); assert(!b.tools);
    const input = JSON.parse(b.input); assert.equal(input.analyzed, 4); assert.deepEqual(input.reviewedComments, ['La guía fue clara.']);
    assert(!JSON.stringify(input).includes('private-reg'));
    return response();
  };
  const output = await runAnalysis(data, {kind: 'survey', fingerprint: p.fingerprint, reviewed: true, comments: ['La guía fue clara.'], fakeStats: {analyzed: 999}}, config, 'success', transport);
  assert.deepEqual(output.report, report);
});
test('la IA recibe los casos calculados sin nombres y no puede incluir texto libre en inscripciones', async () => {
  const data = snapshot(); const p = await analysisPreview(data, 'registrations');
  await assert.rejects(runAnalysis(data, {kind: 'registrations', fingerprint: p.fingerprint, reviewed: true, comments: ['Texto']}, config, 'registration', async () => response()), /no admite/);
  const output = await runAnalysis(data, {kind: 'registrations', fingerprint: p.fingerprint, reviewed: true, comments: []}, config, 'registration', async (_, init) => {
    const payload = JSON.parse(JSON.parse(String(init?.body)).input); assert(payload.duplicateCases.length > 0); assert.equal(payload.reviewedComments.length, 0); return response();
  }); assert.deepEqual(output.report, report);
});
test('errores externos, redirecciones, negativas y JSON incorrecto no se presentan como informes', async () => {
  const data = snapshot(); const p = await analysisPreview(data, 'survey');
  const values = [new Response('secret-in-provider-error', {status: 401}), new Response(null, {status: 302, headers: {Location: 'https://evil.invalid'}}), Response.json({status: 'incomplete'}), Response.json({status: 'completed', output: [{type: 'message', content: [{type: 'refusal'}]}]}), Response.json({status: 'completed', output: [{type: 'message', content: [{type: 'output_text', text: '{}'}]}]})];
  values.push(Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({...report,summary:'Revisar la pregunta Q999 que no existe.'})}]}]}));
  for (const [index, value] of values.entries()) {
    let calls = 0; await assert.rejects(runAnalysis(data, {kind: 'survey', fingerprint: p.fingerprint, reviewed: true, comments: []}, config, `failure-${index}`, async () => {calls++; return value;}), e => e instanceof Error && !e.message.includes('secret-in-provider-error'));
    assert.equal(calls, 1);
  }
});
test('el validador de resultados rechaza claves extra, listas y textos fuera de límites', () => {
  assert.throws(() => parseAnalysisReport({...report, html: '<script>'}));
  assert.throws(() => parseAnalysisReport({...report, summary: ''}));
  assert.throws(() => parseAnalysisReport({...report, recommendations: Array(9).fill('x')}));
});
test('la confirmación permanece estable al refrescar, pero caduca si cambia el origen', async () => {
  const data = snapshot(); const first = await analysisPreview(data, 'survey');
  assert.equal((await analysisPreview({...data, updated: 'other'}, 'survey')).fingerprint, first.fingerprint);
  data.evaluations[0].comment = 'Cambio'; assert.notEqual((await analysisPreview(data, 'survey')).fingerprint, first.fingerprint);
});
test('el limitador local impide múltiples envíos seguidos y vuelve a admitirlos después', () => {
  const key = 'rate-test'; const now = Date.now(); consumeAnalysisAttempt(key, now); consumeAnalysisAttempt(key, now + 1);
  assert.throws(() => consumeAnalysisAttempt(key, now + 2), /Espera/); consumeAnalysisAttempt(key, now + 61000);
});
