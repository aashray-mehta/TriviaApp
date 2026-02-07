import { getDb } from '../db';
import { UserStats, PendingRound, RoundResult } from '../types';
import { pickQuestion, recordRecentQuestion, getQuestionsByCategory } from './questions';
import { UserError } from './auth';

// In-memory store of pending rounds keyed by `userId`
// In a production system this would be in Redis or DB, but for MVP POC
// an in-memory map is fine.
const pendingRounds: Map<number, PendingRound> = new Map();

/** Retrieve the current stats for a user. */
export function getStats(userId: number): UserStats {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM stats WHERE user_id = ?')
    .get(userId) as UserStats | undefined;
  if (!row) {
    throw new UserError('User stats not found');
  }
  return row;
}

/**
 * Validate a wager, pick a question for the user, and store the pending round.
 * Returns the question payload (without the correct answer).
 */
export function startRound(
  userId: number,
  category: string,
  wager: number
): { questionId: string; text: string; options: string[] } {
  // Validate wager
  if (!Number.isInteger(wager) || wager <= 0) {
    throw new UserError('Wager must be a positive integer');
  }

  const stats = getStats(userId);
  if (wager > stats.total_points) {
    throw new UserError(
      `Wager (${wager}) exceeds available points (${stats.total_points})`
    );
  }

  // Pick question
  const question = pickQuestion(userId, category);
  if (!question) {
    throw new UserError(`No questions available for category: ${category}`);
  }

  // Store pending round
  pendingRounds.set(userId, {
    questionId: question.id,
    correctIndex: question.correctIndex,
    wager,
    category,
  });

  return {
    questionId: question.id,
    text: question.text,
    options: question.options,
  };
}

/**
 * Evaluate a submitted answer, update stats, record recent question,
 * and return the result.
 */
export function submitAnswer(
  userId: number,
  questionId: string,
  chosenIndex: number
): RoundResult {
  const pending = pendingRounds.get(userId);
  if (!pending || pending.questionId !== questionId) {
    throw new UserError('No pending round found for this question');
  }

  // Clean up pending round
  pendingRounds.delete(userId);

  const correct = chosenIndex === pending.correctIndex;
  const pointsChange = correct ? pending.wager : -pending.wager;

  // Update stats in DB
  const db = getDb();
  if (correct) {
    db.prepare(
      `UPDATE stats
       SET total_points = total_points + ?,
           games_played = games_played + 1,
           correct_count = correct_count + 1
       WHERE user_id = ?`
    ).run(pending.wager, userId);
  } else {
    db.prepare(
      `UPDATE stats
       SET total_points = MAX(0, total_points - ?),
           games_played = games_played + 1,
           incorrect_count = incorrect_count + 1
       WHERE user_id = ?`
    ).run(pending.wager, userId);
  }

  // Record this question as recently asked
  recordRecentQuestion(userId, questionId);

  // Get updated stats for the response
  const updatedStats = getStats(userId);

  // Find the correct answer text
  const questions = getQuestionsByCategory(pending.category);
  const q = questions.find((qq: any) => qq.id === questionId);
  const correctAnswer = q ? q.options[pending.correctIndex] : 'Unknown';

  return {
    correct,
    pointsChange,
    correctAnswer,
    newTotal: updatedStats.total_points,
  };
}

/** Check if the user has a pending round (useful for resuming). */
export function hasPendingRound(userId: number): boolean {
  return pendingRounds.has(userId);
}

/** Clear a pending round (e.g., if the user abandons it). */
export function clearPendingRound(userId: number): void {
  pendingRounds.delete(userId);
}
