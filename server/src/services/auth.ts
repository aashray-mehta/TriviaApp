import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config';
import { getDb } from '../db';
import { User, UserStats, JwtPayload } from '../types';

/**
 * Register a new user. Returns the created user's id.
 * Throws if the username already exists.
 */
export function registerUser(username: string, password: string): number {
  const db = getDb();

  // Check for duplicate
  const existing = db
    .prepare('SELECT id FROM users WHERE username = ?')
    .get(username) as { id: number } | undefined;
  if (existing) {
    throw new UserError('Username already exists');
  }

  const hash = bcrypt.hashSync(password, config.bcryptRounds);

  const result = db
    .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    .run(username, hash);

  const userId = result.lastInsertRowid as number;

  // Create initial stats row
  db.prepare(
    'INSERT INTO stats (user_id, total_points) VALUES (?, ?)'
  ).run(userId, config.startingPoints);

  return userId;
}

/**
 * Verify credentials and return a JWT token + user info.
 * Throws if credentials are invalid.
 */
export function loginUser(
  username: string,
  password: string
): { token: string; user: { id: number; username: string } } {
  const db = getDb();
  const row = db
    .prepare('SELECT id, username, password_hash FROM users WHERE username = ?')
    .get(username) as Pick<User, 'id' | 'username' | 'password_hash'> | undefined;

  if (!row) {
    throw new UserError('Invalid username or password');
  }

  const valid = bcrypt.compareSync(password, row.password_hash);
  if (!valid) {
    throw new UserError('Invalid username or password');
  }

  const payload: JwtPayload = { userId: row.id, username: row.username };
  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });

  return { token, user: { id: row.id, username: row.username } };
}

/**
 * Verify a JWT token and return its payload.
 * Throws if the token is invalid or expired.
 */
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch {
    throw new UserError('Invalid or expired token');
  }
}

/** Retrieve stats for a user. */
export function getUserStats(userId: number): UserStats | null {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM stats WHERE user_id = ?')
    .get(userId) as UserStats | undefined;
  return row || null;
}

/** Custom error class to distinguish client errors from server errors */
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserError';
  }
}
