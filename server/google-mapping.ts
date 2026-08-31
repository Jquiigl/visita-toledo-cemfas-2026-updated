import type {Evaluation, Person, Registration} from './domain.ts';
import {GoogleReadError, type SheetRow} from './google-reader.ts';
import {choiceOptions, menuOptions, surveyLabels} from './google-schema.ts';

const norm = (v: string) => v.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase().replace(/\s+/g, ' ');
const yesNo = (v: string) => norm(v) === 'si' ? true : norm(v) === 'no' ? false : undefined;
const fail = (row: number, field: string): never => {throw new GoogleReadError(409, `Inscripciones: fila ${row}, ${field} sin interpretar. Revisa la hoja original; no se mostrarán recuentos parciales.`);};
const mobilityConsent = 'Consiento expresamente la información que he facilitado sobre limitaciones y necesidades de movilidad para la gestión de la actividad';
const dietaryConsent = 'Consiento expresamente el tratamiento de la información sobre alergias o intolerancias que he facilitado, exclusivamente para adaptar el servicio de comida y, cuando resulte necesario, su comunicación al proveedor encargado de dicho servicio.';

export function registrationsFromGoogle(rows: SheetRow[]): Registration[] {
  return rows.map(({rowNumber, cells}) => {
    const c = (i: number) => (cells[i] || '').trim();
    if (!c(0)) fail(rowNumber, 'marca temporal');
    const id = `G-${rowNumber}`; const importIssues: string[] = [];
    const groupMeal = yesNo(c(4)); if (groupMeal === undefined) fail(rowNumber, 'asistencia a la comida');
    const bus = yesNo(c(5)); if (c(5) && bus === undefined) fail(rowNumber, 'transporte');
    const hasCompanions = yesNo(c(7)); if (hasCompanions === undefined) fail(rowNumber, 'declaración de acompañantes');
    const person = (index: number): Person => {
      const offset = 8 + (index - 1) * 5;
      const adultText = index ? norm(c(offset + 2)) : 'adulto';
      if (!['adulto', 'menor de edad'].includes(adultText)) fail(rowNumber, `adulto/menor del acompañante ${index}`);
      const menu = c(40 + index); const selected = menuOptions.find(m => norm(m) === norm(menu));
      if (menu && !selected) fail(rowNumber, `menú de la persona ${index + 1}`);
      // A grid selection is per person. Never infer all companions eat from the holder.
      if (!menu && groupMeal) fail(rowNumber, `menú de la persona ${index + 1}`);
      const meal = Boolean(selected && selected !== 'No solicita menú');
      if (meal && !groupMeal) importIssues.push('Se declaró no asistir a la comida, pero hay menús seleccionados');
      if (!index && groupMeal && selected === 'No solicita menú') importIssues.push('El titular declaró asistir a la comida, pero no solicita menú');
      const ageText = index ? c(offset + 3) : '';
      const validAge = /^\d{1,3}$/.test(ageText);
      if (ageText && !validAge) importIssues.push('Edad con formato no válido: revisar el dato original');
      return {id: `${id}:${index}`, name: index ? c(offset) : c(1), role: index ? 'Acompañante' : 'Titular',
        adult: adultText === 'adulto', age: validAge ? Number(ageText) : undefined,
        transport: index || bus === undefined ? undefined : bus ? 'bus' : 'car', meal, menu: meal ? selected! : ''};
    };
    const holder = person(0); const companions: Person[] = [];
    for (let i = 1; i <= 6; i++) {
      const offset = 8 + (i - 1) * 5;
      const hasDetails = [0, 1, 2, 3].some(n => c(offset + n));
      const menu = c(40 + i); const assignedMenu = menu && norm(menu) !== norm('No solicita menú');
      if (!hasDetails) {if (assignedMenu) importIssues.push('Hay un menú asignado a un acompañante sin datos'); continue;}
      companions.push(person(i));
      if (i > 1 && yesNo(c(offset - 1)) !== true) importIssues.push('Hay datos de un acompañante sin confirmación en la sección anterior');
      if (i < 6 && yesNo(c(offset + 4)) === true && ![0, 1, 2, 3].some(n => c(offset + 5 + n))) importIssues.push('Se indicó otro acompañante, pero faltan sus datos');
    }
    if (hasCompanions !== Boolean(companions.length)) importIssues.push('La declaración de acompañantes no coincide con las personas registradas');
    const groupNeeds: {mobility?: string; dietary?: string} = {};
    // Free text is not reliably attributable to individuals. Keep it in a separate,
    // restricted registration note, never copied onto every person's health fields.
    if (yesNo(c(37)) === true || c(38)) {
      importIssues.push('Necesidad de movilidad declarada por inscripción: revisar personas afectadas y apoyo');
      if (norm(c(39)) === norm(mobilityConsent) && c(38)) groupNeeds.mobility = c(38);
      else importIssues.push('Nota de movilidad no mostrada: falta descripción o consentimiento reconocido');
    }
    if (yesNo(c(47)) === true || c(48) || c(49)) {
      importIssues.push('Necesidad alimentaria declarada por inscripción: revisar personas afectadas y medidas');
      if (norm(c(50)) === norm(dietaryConsent) && c(48)) groupNeeds.dietary = [c(48), c(49)].filter(Boolean).join('\n');
      else importIssues.push('Nota alimentaria no mostrada: falta descripción o consentimiento reconocido');
    }
    if (!c(51) || !c(52) || !c(53)) importIssues.push('Confirmaciones o información de protección de datos incompletas: revisar el formulario original');
    return {id, holder, companions, importIssues: [...new Set(importIssues)], groupNeeds,
      ...(c(6) ? {vehicle: {original: c(6), model: '', color: '', plate: ''}} : {})};
  });
}

// Invalid scores remain invalid (not silently converted to missing or to zero).
function score(value: string): number | null {if (!value.trim()) return null; return /^\d+$/.test(value.trim()) ? Number(value) : -1;}
export function evaluationsFromGoogle(rows: SheetRow[]): Evaluation[] {
  return rows.map(({rowNumber, cells}) => {
    const c = (i: number) => (cells[i] || '').trim();
    if (!c(0)) throw new GoogleReadError(409, `Valoración: fila ${rowNumber} sin marca temporal. Revisa la hoja original.`);
    return {id: `E-${rowNumber}`, scores: Object.fromEntries(surveyLabels.map((label, i) => [label, score(c(i + 1))])),
      relationshipScore: score(c(14)), categories: {Duración: c(9), Ritmo: c(10), Recomendación: c(15)},
      comment: [[11, 'Parte más interesante'], [12, 'Aspectos a mejorar'], [13, 'Propuestas para futuras ediciones']].flatMap(([i, title]) => c(Number(i)) ? [`${title}: ${c(Number(i))}`] : []).join('\n\n')};
  });
}

export function extraSurvey(evaluations: Evaluation[]) {
  const frequency = new Map<string, number>(); for (const e of evaluations) frequency.set(e.id, (frequency.get(e.id) || 0) + 1);
  const accepted = evaluations.filter(e => frequency.get(e.id) === 1);
  const withExtra = accepted.filter(e => e.relationshipScore !== undefined || e.categories !== undefined);
  const values = withExtra.map(e => e.relationshipScore).filter((v): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 10);
  const missing = withExtra.filter(e => e.relationshipScore == null).length;
  const categories = Object.entries(choiceOptions).map(([question, options]) => {
    let n = 0, missing = 0, invalid = 0; const counts = options.map(() => 0);
    for (const e of withExtra) {
      const text = e.categories?.[question]?.trim(); if (!text) {missing++; continue;}
      const selections = text.split(',').map(s => s.trim());
      const indexes = selections.map(s => options.findIndex(o => norm(o) === norm(s)));
      if (indexes.some(i => i < 0) || new Set(indexes).size !== indexes.length || (question !== 'Recomendación' && indexes.length !== 1)) {invalid++; continue;}
      n++; for (const i of indexes) counts[i]++;
    }
    return {question, n, missing, invalid, multiple: question === 'Recomendación', distribution: options.map((label, i) => ({label, count: counts[i], percent: n ? counts[i] / n * 100 : 0}))};
  });
  return {available: withExtra.length > 0, relationship: {n: values.length, mean: values.length ? values.reduce((s, n) => s + n, 0) / values.length : null, missing, invalid: withExtra.length - missing - values.length,
    distribution: Array.from({length: 11}, (_, score) => ({score, count: values.filter(v => v === score).length}))}, categories};
}
