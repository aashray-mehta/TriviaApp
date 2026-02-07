import Database from 'better-sqlite3';
import config from '../config';
import {
  CREATE_USERS_TABLE,
  CREATE_STATS_TABLE,
  CREATE_RECENT_QUESTIONS_TABLE,
  CREATE_RECENT_QUESTIONS_INDEX,
} from './schema';

let db: Database.Database;

/** Initialise (or re-initialise) the database connection and create tables. */
export function initDb(dbPath?: string): Database.Database {
  db = new Database(dbPath || config.dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(CREATE_USERS_TABLE);
  db.exec(CREATE_STATS_TABLE);
  db.exec(CREATE_RECENT_QUESTIONS_TABLE);
  db.exec(CREATE_RECENT_QUESTIONS_INDEX);

  // Migration: add retry_count column if it doesn't exist (for DBs created before this feature)
  const columns = db.pragma('table_info(stats)') as { name: string }[];
  const hasRetryCount = columns.some((c) => c.name === 'retry_count');
  if (!hasRetryCount) {
    db.exec('ALTER TABLE stats ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0');
  }

  return db;
}

/** Return the current database instance. Throws if not initialised. */
export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialised – call initDb() first');
  }
  return db;
}

/** Close the database connection (useful for tests). */
export function closeDb(): void {
  if (db) {
    db.close();
  }
}
