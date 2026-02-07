/**
 * System tests: end-to-end HTTP tests for the REST API.
 * Uses Supertest against the Express app to verify client–server communication.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { initDb, closeDb } from '../db';
import { loadAllQuestions } from '../services/questions';

describe('System Tests — REST API', () => {
  let token: string;

  beforeAll(() => {
    initDb(':memory:');
    loadAllQuestions();
  });

  afterAll(() => {
    closeDb();
  });

  // ============================================================
  // Auth endpoints
  // ============================================================

  describe('POST /auth/register', () => {
    it('should register a new user and return 201', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ username: 'sysuser', password: 'testpass' });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBeGreaterThan(0);
    });

    it('should reject duplicate username with 409', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ username: 'sysuser', password: 'anotherpass' });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already exists');
    });

    it('should reject missing username with 400', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ password: 'testpass' });

      expect(res.status).toBe(400);
    });

    it('should reject short password with 400', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ username: 'shortpw', password: 'ab' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials and return a token', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'sysuser', password: 'testpass' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
      expect(res.body.user.username).toBe('sysuser');

      // Save token for subsequent tests
      token = res.body.token;
    });

    it('should reject invalid password with 401', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'sysuser', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });
  });

  // ============================================================
  // Unauthenticated access
  // ============================================================

  describe('Unauthenticated access', () => {
    it('should return 401 for /game/categories without token', async () => {
      const res = await request(app).get('/game/categories');
      expect(res.status).toBe(401);
    });

    it('should return 401 for /stats without token', async () => {
      const res = await request(app).get('/stats');
      expect(res.status).toBe(401);
    });
  });

  // ============================================================
  // Game endpoints
  // ============================================================

  describe('GET /game/categories', () => {
    it('should return a list of categories', async () => {
      const res = await request(app)
        .get('/game/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(res.body.categories.length).toBeGreaterThan(0);
    });
  });

  describe('POST /game/wager + POST /game/submit (full round)', () => {
    it('should complete a full game round', async () => {
      // Get categories
      const catRes = await request(app)
        .get('/game/categories')
        .set('Authorization', `Bearer ${token}`);

      const category = catRes.body.categories[0];

      // Submit a wager
      const wagerRes = await request(app)
        .post('/game/wager')
        .set('Authorization', `Bearer ${token}`)
        .send({ category, wager: 10 });

      expect(wagerRes.status).toBe(200);
      expect(wagerRes.body.questionId).toBeTruthy();
      expect(wagerRes.body.text).toBeTruthy();
      expect(Array.isArray(wagerRes.body.options)).toBe(true);

      // Submit an answer (index 0)
      const submitRes = await request(app)
        .post('/game/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionId: wagerRes.body.questionId,
          chosenIndex: 0,
        });

      expect(submitRes.status).toBe(200);
      expect(typeof submitRes.body.correct).toBe('boolean');
      expect(typeof submitRes.body.pointsChange).toBe('number');
      expect(submitRes.body.correctAnswer).toBeTruthy();
      expect(typeof submitRes.body.newTotal).toBe('number');
    });

    it('should reject wager exceeding points with 400', async () => {
      const catRes = await request(app)
        .get('/game/categories')
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .post('/game/wager')
        .set('Authorization', `Bearer ${token}`)
        .send({ category: catRes.body.categories[0], wager: 999999 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('exceeds');
    });
  });

  // ============================================================
  // Stats endpoint
  // ============================================================

  describe('GET /stats', () => {
    it('should return user stats after playing', async () => {
      const res = await request(app)
        .get('/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(typeof res.body.totalPoints).toBe('number');
      expect(typeof res.body.gamesPlayed).toBe('number');
      expect(res.body.gamesPlayed).toBeGreaterThanOrEqual(1);
      expect(typeof res.body.accuracy).toBe('number');
    });
  });

  // ============================================================
  // Error handling
  // ============================================================

  describe('Error handling', () => {
    it('should handle malformed JSON with 400', async () => {
      const res = await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ bad json }');

      expect(res.status).toBe(400);
    });

    it('should return 401 for invalid token', async () => {
      const res = await request(app)
        .get('/game/categories')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.status).toBe(401);
    });
  });

  // ============================================================
  // Health check
  // ============================================================

  describe('GET /health', () => {
    it('should return ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
