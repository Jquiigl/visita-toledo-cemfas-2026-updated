import {googleSources} from './google-schema.ts';

export type GoogleCredentials = {GOOGLE_SERVICE_ACCOUNT_EMAIL?: string; GOOGLE_PRIVATE_KEY?: string};
export class GoogleReadError extends Error {constructor(public status: number, message: string) {super(message);}}
export type SheetRow = {rowNumber: number; cells: string[]};
const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const json64 = (value: unknown) => base64url(new TextEncoder().encode(JSON.stringify(value)));

// Per-request reader: no persisted responses or credentials, no write methods.
export class GoogleReader {
  private token?: Promise<string>;
  constructor(private env: GoogleCredentials, private transport: typeof fetch = fetch) {}
  private async request(url: string, init: RequestInit = {}) {
    let response: Response;
    try {response = await this.transport(url, {...init, redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(15000)});}
    catch {throw new GoogleReadError(502, 'Google no responde. Vuelve a intentarlo; no se han cambiado las respuestas.');}
    if (!response.ok) {
      await response.body?.cancel();
      throw new GoogleReadError(response.status === 429 ? 429 : 502,
        response.status === 429 ? 'Google ha limitado las consultas. Espera un minuto antes de actualizar.' :
        url.startsWith('https://oauth2.googleapis.com/') ? 'Google no ha autorizado la cuenta de servicio. Revisa su correo y clave privada en Cloudflare.' :
        'No se puede leer Google Sheets. Comprueba que la API esté habilitada y que ambas hojas estén compartidas como Lector con la cuenta de servicio.');
    }
    const reader = response.body?.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    if (reader) while (true) {const item = await reader.read(); if (item.done) break; size += item.value.byteLength;
      if (size > 4_000_000) {await reader.cancel(); throw new GoogleReadError(413, 'La hoja supera el tamaño de lectura seguro. No se mostrarán totales parciales.');} chunks.push(item.value);}
    const bytes = new Uint8Array(size); let at = 0; for (const chunk of chunks) {bytes.set(chunk, at); at += chunk.length;}
    try {return JSON.parse(new TextDecoder().decode(bytes));}
    catch {throw new GoogleReadError(502, 'Google devolvió una respuesta no válida.');}
  }
  private async authorize() {
    const email = this.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim(), privateKey = this.env.GOOGLE_PRIVATE_KEY?.trim();
    if (!email || !privateKey) throw new GoogleReadError(503, 'Faltan GOOGLE_SERVICE_ACCOUNT_EMAIL o GOOGLE_PRIVATE_KEY en los secretos de producción de Cloudflare.');
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.iam\.gserviceaccount\.com$/.test(email)) throw new GoogleReadError(503, 'GOOGLE_SERVICE_ACCOUNT_EMAIL debe contener el correo de la cuenta de servicio, no el correo personal.');
    let signature: ArrayBuffer; let input: string;
    try {
      const pem = privateKey.replaceAll('\\n', '\n').trim();
      if (!pem.startsWith('-----BEGIN PRIVATE KEY-----') || !pem.endsWith('-----END PRIVATE KEY-----')) throw Error();
      const bytes = Uint8Array.from(atob(pem.replace(/-----[^-]+-----|\s/g, '')), c => c.charCodeAt(0));
      const key = await crypto.subtle.importKey('pkcs8', bytes, {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'}, false, ['sign']);
      const now = Math.floor(Date.now() / 1000);
      input = `${json64({alg: 'RS256', typ: 'JWT'})}.${json64({iss: email, scope: 'https://www.googleapis.com/auth/spreadsheets.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600})}`;
      signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input));
    } catch {throw new GoogleReadError(503, 'GOOGLE_PRIVATE_KEY no tiene un formato válido. Guarda solo el campo private_key del JSON, con BEGIN/END y sin comillas exteriores.');}
    const result = await this.request('https://oauth2.googleapis.com/token', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: new URLSearchParams({grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${input}.${base64url(new Uint8Array(signature))}`})});
    if (typeof result?.access_token !== 'string' || !result.access_token || result.token_type?.toLowerCase() !== 'bearer') throw new GoogleReadError(502, 'Google devolvió una autorización no válida.');
    return result.access_token as string;
  }
  async read(source: keyof typeof googleSources): Promise<SheetRow[]> {
    const config = googleSources[source]; const token = await (this.token ??= this.authorize());
    const headers = {Authorization: `Bearer ${token}`};
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.id}`;
    const meta = await this.request(`${url}?fields=spreadsheetId,sheets(properties(sheetId,title,gridProperties(rowCount,columnCount)))`, {headers});
    const sheet = Array.isArray(meta.sheets) ? meta.sheets.find((s: {properties?: {sheetId?: number}}) => s.properties?.sheetId === config.sheetId)?.properties : undefined;
    if (meta.spreadsheetId !== config.id || sheet?.title !== config.tab) throw new GoogleReadError(409, 'La pestaña de respuestas ha cambiado. Revisa su configuración antes de actualizar los datos.');
    const count = sheet.gridProperties?.rowCount;
    if (!Number.isInteger(count) || count < 1 || count > 10000) throw new GoogleReadError(413, 'La hoja requiere revisar el límite de lectura (máximo 10.000 filas de cuadrícula). No se mostrarán totales parciales.');
    const rows: SheetRow[] = []; let totalChars = 0;
    // Read every allocated row, including rows after gaps. Never stop at a blank.
    for (let start = 1; start <= count; start += 500) {
      const end = Math.min(count, start + 499); const range = `'${config.tab}'!A${start}:${config.lastColumn}${end}`;
      const data = await this.request(`${url}/values/${encodeURIComponent(range)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`, {headers});
      const values = data.values ?? [];
      if (!Array.isArray(values) || values.length > end - start + 1) throw new GoogleReadError(502, 'Google devolvió un rango no válido.');
      if (start === 1 && !values.length) throw new GoogleReadError(409, 'La hoja no contiene las cabeceras esperadas.');
      for (let i = 0; i < values.length; i++) {
        if (!Array.isArray(values[i]) || values[i].length > config.headers.length || values[i].some((v: unknown) => !['string', 'number', 'boolean'].includes(typeof v))) throw new GoogleReadError(502, 'Google devolvió celdas no válidas.');
        const cells = values[i].map(String) as string[];
        totalChars += cells.join('').length;
        if (totalChars > 2_000_000 || cells.some(c => c.length > 10000)) throw new GoogleReadError(413, 'El contenido supera el tamaño de lectura seguro. No se mostrarán totales parciales.');
        if (start === 1 && i === 0) {
          if (cells.length !== config.headers.length || cells.some((c, j) => c.trim() !== config.headers[j].trim())) throw new GoogleReadError(409, 'Las columnas del formulario han cambiado. Hay que revisar el mapeo; no se mezclarán nombres ni respuestas.');
        } else if (cells.some(c => c.trim())) rows.push({rowNumber: start + i, cells});
      }
    }
    return rows;
  }
}
