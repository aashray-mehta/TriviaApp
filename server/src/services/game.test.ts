import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '../db';
import { registerUser } from './auth';
import { getStats, startRound, submitAnswer } from './game';
import { loadAllQuestions, getCategories, getQuestionsByCategory } from './questions';
import { UserError } from './auth';
import config from '../config';

describe('Game Service', () => {
  let userId: number;

  beforeAll(() => {
    initDb(':memory:');
    loadAllQuestions();
    userId = registerUser('gameuser', 'password123');
  });

  afterAll(() => {
    closeDb();
  });

  describe('getStats', () => {
    it('should return initial stats for a new user', () => {
      const stats = getStats(userId);
      expect(stats.total_points).toBe(config.startingPoints);
      expect(stats.games_played).toBe(0);
      expect(stats.correct_count).toBe(0);
      expect(stats.incorrect_count).toBe(0);
    });
  });

  describe('startRound', () => {
    it('should return a question payload for a valid category and wager', () => {
      const categories = getCategories();
      expect(categories.length).toBeGreaterThan(0);

      const q = startRound(userId, categories[0], 10);
      expect(q.questionId).toBeTruthy();
      expect(q.text).toBeTruthy();
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    });

    it('should throw for wager exceeding available points', () => {
      const categories = getCategories();
      expect(() => startRound(userId, categories[0], 99999)).toThrow(UserError);
    });

    it('should throw for zero or negative wager', () => {
      const categories = getCategories();
      expect(() => startRound(userId, categories[0], 0)).toThrow(UserError);
      expect(() => startRound(userId, categories[0], -5)).toThrow(UserError);
    });

    it('should throw for non-existent category', () => {
      expect(() => startRound(userId, 'NonExistentCat', 10)).toThrow(UserError);
    });
  });

  describe('submitAnswer', () => {
    it('should increase points for a correct answer', () => {
      const categories = getCategories();
      const wager = 10;
      const q = startRound(userId, categories[0], wager);

      // Look up the correct index from loaded questions
      const questions = getQuestionsByCategory(categories[0]);
      const fullQ = questions.find((qq) => qq.id === q.questionId)!;
      const correctIdx = fullQ.correctIndex;

      const before = getStats(userId).total_points;
      const result = submitAnswer(userId, q.questionId, correctIdx);

      expect(result.correct).toBe(true);
      expect(result.pointsChange).toBe(wager);
      expect(result.newTotal).toBe(before + wager);
    });

    it('should decrease points for an incorrect answer', () => {
      const categories = getCategories();
      const wager = 5;
      const q = startRound(userId, categories[0], wager);

      // Find the correct index and pick a wrong one
      const questions = getQuestionsByCategory(categories[0]);
      const fullQ = questions.find((qq) => qq.id === q.questionId)!;
      const wrongIdx = (fullQ.correctIndex + 1) % fullQ.options.length;

      const before = getStats(userId).total_points;
      const result = submitAnswer(userId, q.questionId, wrongIdx);

      expect(result.correct).toBe(false);
      expect(result.pointsChange).toBe(-wager);
      expect(result.newTotal).toBe(before - wager);
    });

    it('should throw for submitting without a pending round', () => {
      expect(() => submitAnswer(userId, 'nonexistent', 0)).toThrow(UserError);
    });

    it('should increment games_played after each round', () => {
      const statsBefore = getStats(userId);
      const categories = getCategories();
      const q = startRound(userId, categories[0], 1);
      submitAnswer(userId, q.questionId, 0);
      const statsAfter = getStats(userId);
      expect(statsAfter.games_played).toBe(statsBefore.games_played + 1);
    });
  });
});
