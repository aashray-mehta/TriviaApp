import fs from 'fs';
import path from 'path';
import config from '../config';
import { getDb } from '../db';
import { TriviaQuestion } from '../types';

// In-memory store: category name → questions[]
const questionsByCategory: Map<string, TriviaQuestion[]> = new Map();

/**
 * Load all question JSON files from the data/questions directory into memory.
 * Each .json file is expected to contain an array of TriviaQuestion objects.
 */
export function loadAllQuestions(): void {
  const dir = config.questionsDir;
  if (!fs.existsSync(dir)) {
    console.warn(`Questions directory not found: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const filePath = path.join(dir, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const questions: TriviaQuestion[] = JSON.parse(raw);
    if (questions.length > 0) {
      const category = questions[0].category;
      questionsByCategory.set(category, questions);
    }
  }
  console.log(
    `Loaded ${questionsByCategory.size} categories: ${[...questionsByCategory.keys()].join(', ')}`
  );
}

/** Return all available category names. */
export function getCategories(): string[] {
  return [...questionsByCategory.keys()];
}

/** Return all questions for a given category. */
export function getQuestionsByCategory(category: string): TriviaQuestion[] {
  return questionsByCategory.get(category) || [];
}

/**
 * Pick a question from the given category for a user, excluding recently-asked
 * question IDs. Returns null if no un-asked questions remain.
 */
export function pickQuestion(
  userId: number,
  category: string
): TriviaQuestion | null {
  const questions = getQuestionsByCategory(category);
  if (questions.length === 0) return null;

  const db = getDb();
  const recentRows = db
    .prepare(
      `SELECT question_id FROM recent_questions
       WHERE user_id = ?
       ORDER BY asked_at DESC
       LIMIT ?`
    )
    .all(userId, config.recentQuestionsLimit) as { question_id: string }[];

  const recentIds = new Set(recentRows.map((r) => r.question_id));

  // Filter to questions not recently asked
  const available = questions.filter((q) => !recentIds.has(q.id));

  // If all have been asked recently, allow any (wrap around)
  const pool = available.length > 0 ? available : questions;

  // Pick a random question from the pool
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

/** Record a question as recently asked for a user. */
export function recordRecentQuestion(
  userId: number,
  questionId: string
): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO recent_questions (user_id, question_id) VALUES (?, ?)`
  ).run(userId, questionId);
}
