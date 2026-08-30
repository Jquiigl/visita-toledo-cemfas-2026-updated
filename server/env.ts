import { env } from 'cloudflare:workers';
export type Runtime = { DB: D1Database; ADMIN_USERS?: string; DATA_SOURCE?: string; GOOGLE_SERVICE_ACCOUNT_EMAIL?: string; GOOGLE_PRIVATE_KEY?: string; REGISTRATION_SHEET_ID?: string; EVALUATION_SHEET_ID?: string; REGISTRATION_RANGE?: string; EVALUATION_RANGE?: string; GOOGLE_COLUMN_MAPPING?: string; OPENAI_API_KEY?: string; OPENAI_MODEL?: string };
export const runtime = env as unknown as Runtime;
