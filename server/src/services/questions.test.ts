import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '../db';
import { registerUser } from './auth';
import {
  loadAllQuestions,
  getCategories,
  getQuestionsByCategory,
  pickQuestion,
  recordRecentQuestion,
} from './questions';
import config from '../config';

describe('Questions Service', () => {
  let userId: number;

  beforeAll(() => {
    initDb(':memory:');
    loadAllQuestions();
    userId = registerUser('questionsuser', 'password123');
  });

  afterAll(() => {
    closeDb();
  });

  describe('loadAllQuestions', () => {
    it('should load at least one category', () => {
      const categories = getCategories();
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should load questions into each category', () => {
      const categories = getCategories();
      for (const cat of categories) {
        const questions = getQuestionsByCategory(cat);
        expect(questions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getCategories', () => {
    it('should return an array of strings', () => {
      const categories = getCategories();
      expect(Array.isArray(categories)).toBe(true);
      categories.forEach((cat) => {
        expect(typeof cat).toBe('string');
      });
    });
  });

  describe('getQuestionsByCategory', () => {
    it('should return questions for a valid category', () => {
      const categories = getCategories();
      const questions = getQuestionsByCategory(categories[0]);
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should return an empty array for an unknown category', () => {
      const questions = getQuestionsByCategory('NonExistentCategory');
      expect(questions).toEqual([]);
    });

    it('should return questions with the correct shape', () => {
      const categories = getCategories();
      const questions = getQuestionsByCategory(categories[0]);
      const q = questions[0];
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('category');
      expect(q).toHaveProperty('text');
      expect(q).toHaveProperty('options');
      expect(q).toHaveProperty('correctIndex');
      expect(Array.isArray(q.options)).toBe(true);
      expect(typeof q.correctIndex).toBe('number');
    });

    it('should have correctIndex within bounds of options array', () => {
      const categories = getCategories();
      for (const cat of categories) {
        const questions = getQuestionsByCategory(cat);
        for (const q of questions) {
          expect(q.correctIndex).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex).toBeLessThan(q.options.length);
        }
      }
    });
  });

  describe('pickQuestion', () => {
    it('should return a question for a valid category', () => {
      const categories = getCategories();
      const question = pickQuestion(userId, categories[0]);
      expect(question).not.toBeNull();
      expect(question!.category).toBe(categories[0]);
    });

    it('should return null for a non-existent category', () => {
      const question = pickQuestion(userId, 'NonExistentCategory');
      expect(question).toBeNull();
    });

    it('should avoid recently asked questions', () => {
      const categories = getCategories();
      const category = categories[0];
      const questions = getQuestionsByCategory(category);

      // Record all but one question as recently asked
      const keepId = questions[questions.length - 1].id;
      for (const q of questions) {
        if (q.id !== keepId) {
          recordRecentQuestion(userId, q.id);
        }
      }

      // The picked question should be the one not recently asked
      const picked = pickQuestion(userId, category);
      expect(picked).not.toBeNull();
      expect(picked!.id).toBe(keepId);
    });

    it('should wrap around when all questions have been recently asked', () => {
      // Create a fresh user so we have a clean recent_questions slate
      const freshUserId = registerUser('wrapuser', 'password123');
      const categories = getCategories();
      const category = categories[0];
      const questions = getQuestionsByCategory(category);

      // Record every question as recently asked
      for (const q of questions) {
        recordRecentQuestion(freshUserId, q.id);
      }

      // Should still return a question (wrap around)
      const picked = pickQuestion(freshUserId, category);
      expect(picked).not.toBeNull();
    });
  });

  describe('recordRecentQuestion', () => {
    it('should insert a record into the recent_questions table', () => {
      const trackUserId = registerUser('trackuser', 'password123');
      const categories = getCategories();
      const questions = getQuestionsByCategory(categories[0]);
      const questionId = questions[0].id;

      recordRecentQuestion(trackUserId, questionId);

      const db = getDb();
      const rows = db
        .prepare(
          'SELECT * FROM recent_questions WHERE user_id = ? AND question_id = ?'
        )
        .all(trackUserId, questionId) as { user_id: number; question_id: string }[];

      expect(rows.length).toBe(1);
      expect(rows[0].user_id).toBe(trackUserId);
      expect(rows[0].question_id).toBe(questionId);
    });
  });
});
