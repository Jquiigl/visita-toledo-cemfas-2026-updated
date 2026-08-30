import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const sessions = sqliteTable('sessions', { token: text('token').primaryKey(), username: text('username').notNull(), fingerprint: text('fingerprint').notNull(), lastSeen: integer('last_seen').notNull(), created: integer('created').notNull() });
export const attempts = sqliteTable('attempts', { key: text('key').primaryKey(), count: integer('count').notNull(), expires: integer('expires').notNull() });
export const settings = sqliteTable('settings', { key: text('key').primaryKey(), value: text('value').notNull() });
