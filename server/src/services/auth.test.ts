import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDb, closeDb } from '../db';
import { registerUser, loginUser, verifyToken, getUserStats, UserError } from './auth';

describe('Auth Service', () => {
  beforeAll(() => {
    // Use in-memory database for tests
    initDb(':memory:');
  });

  afterAll(() => {
    closeDb();
  });

  describe('registerUser', () => {
    it('should register a new user and return a user id', () => {
      const id = registerUser('testuser', 'password123');
      expect(id).toBeGreaterThan(0);
    });

    it('should create initial stats with starting points', () => {
      const id = registerUser('statsuser', 'password123');
      const stats = getUserStats(id);
      expect(stats).not.toBeNull();
      expect(stats!.total_points).toBe(100);
      expect(stats!.games_played).toBe(0);
      expect(stats!.correct_count).toBe(0);
      expect(stats!.incorrect_count).toBe(0);
    });

    it('should throw UserError for duplicate username', () => {
      registerUser('dupuser', 'password123');
      expect(() => registerUser('dupuser', 'password456')).toThrow(UserError);
    });
  });

  describe('loginUser', () => {
    it('should return a token and user info for valid credentials', () => {
      registerUser('loginuser', 'mypassword');
      const result = loginUser('loginuser', 'mypassword');
      expect(result.token).toBeTruthy();
      expect(result.user.username).toBe('loginuser');
    });

    it('should throw UserError for wrong password', () => {
      registerUser('wrongpw', 'correctpassword');
      expect(() => loginUser('wrongpw', 'wrongpassword')).toThrow(UserError);
    });

    it('should throw UserError for non-existent user', () => {
      expect(() => loginUser('doesnotexist', 'password')).toThrow(UserError);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token and return the payload', () => {
      registerUser('tokenuser', 'pass1234');
      const { token } = loginUser('tokenuser', 'pass1234');
      const payload = verifyToken(token);
      expect(payload.username).toBe('tokenuser');
      expect(payload.userId).toBeGreaterThan(0);
    });

    it('should throw UserError for an invalid token', () => {
      expect(() => verifyToken('invalid.token.here')).toThrow(UserError);
    });
  });
});
