import { runtime } from './env';
export const db = () => runtime.DB;
export async function getSetting(key: string, fallback: string) { const row = await db().prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{value:string}>(); return row?.value ?? fallback; }
export async function setSetting(key: string, value: string) { await db().prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,value).run(); }
