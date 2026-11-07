import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const DATA_DIR = resolve(process.env.DATA_DIR || join(import.meta.dirname, '..', 'data'))
mkdirSync(DATA_DIR, { recursive: true })

export const db = new DatabaseSync(join(DATA_DIR, 'tirequeue.db'))

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS shops (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    code            TEXT NOT NULL UNIQUE,
    admin_secret    TEXT NOT NULL UNIQUE,
    accepting       INTEGER NOT NULL DEFAULT 1,
    avg_service_min INTEGER NOT NULL DEFAULT 20,
    created_at      TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS entries (
    id           TEXT PRIMARY KEY,
    shop_id      TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    car_color    TEXT NOT NULL,
    car_model    TEXT NOT NULL,
    plate        TEXT NOT NULL,
    status       TEXT NOT NULL,
    client_token TEXT NOT NULL,
    created_at   TEXT NOT NULL,
    called_at    TEXT,
    ended_at     TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_entries_shop_status ON entries(shop_id, status, created_at);
`)

console.log(`[db] ${join(DATA_DIR, 'tirequeue.db')}`)
