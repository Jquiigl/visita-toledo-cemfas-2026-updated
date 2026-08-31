import {normalize, review, statistics} from './domain.ts';
import type {Registration, Evaluation, Attendee} from './domain.ts';

export type DuplicateCase = {
  id: string; kind: 'coincidente' | 'parecido'; people: Attendee[];
  reason: string; sameRegistration: boolean; ageConflict: boolean;
  transportConflict: boolean; mealConflict: boolean;
};
export function normalizedName(value: string) {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('es')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/).sort().join(' ');
}
// A single insertion/deletion/substitution or adjacent transposition. We do not
// equate people just because they share a surname, initials, or household.
function oneEdit(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    const diff = [...a].map((c, i) => c === b[i] ? -1 : i).filter(i => i >= 0);
    return diff.length === 1 || (diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]]);
  }
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  let i = 0; while (i < short.length && short[i] === long[i]) i++;
  return short.slice(i) === long.slice(i + 1);
}
export function similarName(a: string, b: string) {
  if (a === b || a.length < 8 || b.length < 8) return false;
  const aa = a.split(' '), bb = b.split(' ');
  if (aa.length < 2 || aa.length !== bb.length) return false;
  const left = [...aa], right = [...bb];
  for (let i = left.length - 1; i >= 0; i--) {
    const j = right.indexOf(left[i]);
    if (j >= 0) {left.splice(i, 1); right.splice(j, 1);}
  }
  return left.length === 1 && right.length === 1 && Math.min(left[0].length, right[0].length) >= 4 && oneEdit(left[0], right[0]);
}

export function registrationAudit(registrations: Registration[], inheritTransport = true) {
  const people = normalize(registrations, inheritTransport);
  const errors = review(registrations, people).filter(i => !i.reason.startsWith('Posible duplicado'));
  for (const p of people) {
    if (p.age !== undefined && (!Number.isFinite(p.age) || !Number.isInteger(p.age)))
      errors.push({registrationId: p.registrationId, person: p.name, reason: 'Edad no válida: debe ser un número entero'});
    if (p.name.trim() && !/\p{L}/u.test(p.name))
      errors.push({registrationId: p.registrationId, person: p.name, reason: 'Nombre sin letras: comprobar el dato original'});
  }
  const groups = new Map<string, Attendee[]>();
  for (const p of people) {const key = normalizedName(p.name); if (key) {if (!groups.has(key)) groups.set(key, []); groups.get(key)!.push(p);}}
  const duplicates: DuplicateCase[] = [];
  const add = (members: Attendee[], kind: DuplicateCase['kind']) => {
    duplicates.push({id: `D${duplicates.length + 1}`, kind, people: members,
      reason: kind === 'coincidente' ? 'Coinciden las palabras del nombre tras normalizar tildes, espacios y orden. Puede tratarse de homónimos.' : 'Solo una palabra del nombre difiere en una letra o una transposición. Es un indicio, no una identidad confirmada.',
      sameRegistration: new Set(members.map(p => p.registrationId)).size === 1,
      ageConflict: new Set(members.map(p => p.adult)).size > 1 || new Set(members.map(p => p.age).filter(a => a !== undefined)).size > 1,
      transportConflict: new Set(members.map(p => p.transport).filter(Boolean)).size > 1,
      mealConflict: new Set(members.map(p => p.meal)).size > 1,
    });
  };
  for (const members of groups.values()) if (members.length > 1) add(members, 'coincidente');
  const names = [...groups.keys()]; let comparisons = 0; let partial = names.length > 2000 || names.some(n => n.length > 160);
  const candidates = names.filter(n => n.length <= 160).slice(0, 2000);
  // Similar names must share all but one token. Index tokens so unrelated names
  // never need an expensive pairwise comparison on an edge-worker request.
  const tokenIndex = new Map<string, number[]>();
  const tokens = candidates.map(name => [...new Set(name.split(' '))]);
  tokens.forEach((words, i) => words.forEach(word => {if (!tokenIndex.has(word)) tokenIndex.set(word, []); tokenIndex.get(word)!.push(i);}));
  outer: for (let i = 0; i < candidates.length; i++) {
    const matches = new Set(tokens[i].flatMap(word => tokenIndex.get(word)!).filter(j => j > i));
    for (const j of [...matches].sort((a, b) => a - b)) {
      if (++comparisons > 10000) {partial = true; break outer;}
      if (similarName(candidates[i], candidates[j])) add([...groups.get(candidates[i])!, ...groups.get(candidates[j])!], 'parecido');
    }
  }
  const affected = new Set([...errors.map(e => e.registrationId), ...duplicates.flatMap(d => d.people.map(p => p.registrationId))]);
  const issues = [...errors, ...duplicates.flatMap(d => d.people.map(p => ({registrationId: p.registrationId, person: p.name, reason: `${d.id} · Posible duplicado: nombre ${d.kind}`})))];
  return {errors, duplicates, affectedRegistrations: affected.size, partial, comparisons, issues};
}

export function surveyDashboard(evaluations: Evaluation[]) {
  const ids = new Map<string, number>(); for (const e of evaluations) ids.set(e.id, (ids.get(e.id) || 0) + 1);
  const duplicateIds = [...ids].filter(([, n]) => n > 1).map(([id]) => id);
  // Do not arbitrarily choose between different responses with the same ID.
  const accepted = evaluations.filter(e => ids.get(e.id) === 1);
  const questions = statistics(accepted).map((s, index) => {
    const missing = accepted.filter(e => e.scores[s.question] === undefined || e.scores[s.question] === null).length;
    const invalid = accepted.length - missing - s.n;
    const favorable = s.distribution.filter(d => d.score >= 4).reduce((sum, d) => sum + d.count, 0);
    return {...s, code: `Q${index + 1}`, missing, invalid, favorable, favorablePercent: s.n ? favorable / s.n * 100 : null};
  });
  const global = questions.find(q => normalizedName(q.question) === 'global');
  const ranked = questions.filter(q => q.n > 0).sort((a, b) => b.mean! - a.mean!);
  const summary = !accepted.length ? 'Todavía no hay respuestas válidas para analizar.' :
    `${accepted.length} respuestas analizadas; ${accepted.filter(e => e.comment.trim()).length} contienen comentarios.` +
    (global?.n ? ` Valoración global: ${global.mean!.toFixed(2)} sobre 5, con ${global.n} respuestas válidas.` : ' No hay una valoración global válida identificada.') +
    ' La participación no se calcula sin un censo validado. Las respuestas no representan necesariamente a todos los asistentes.';
  return {received: evaluations.length, responses: accepted.length, excluded: evaluations.length - accepted.length,
    duplicateIds, comments: accepted.filter(e => e.comment.trim()), questions, global: global || null,
    best: ranked[0] || null, improvement: ranked.length > 1 ? ranked[ranked.length - 1] : null,
    invalid: questions.reduce((n, q) => n + q.invalid, 0), summary};
}
