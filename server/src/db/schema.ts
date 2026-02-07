/** SQL statements to initialise the SQLite database */

export const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`;

export const CREATE_STATS_TABLE = `
  CREATE TABLE IF NOT EXISTS stats (
    user_id        INTEGER PRIMARY KEY,
    total_points   INTEGER NOT NULL DEFAULT 100,
    games_played   INTEGER NOT NULL DEFAULT 0,
    correct_count  INTEGER NOT NULL DEFAULT 0,
    incorrect_count INTEGER NOT NULL DEFAULT 0,
    retry_count    INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`;

export const CREATE_RECENT_QUESTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS recent_questions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    question_id TEXT    NOT NULL,
    asked_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`;

export const CREATE_RECENT_QUESTIONS_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_recent_questions_user
  ON recent_questions(user_id);
`;
