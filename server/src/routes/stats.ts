import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { getStats } from '../services/game';
import { UserError } from '../services/auth';
import { getDb } from '../db';

const router = Router();

// All stats routes require authentication
router.use(requireAuth);

/** GET /stats */
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;

  try {
    const stats = getStats(userId);
    const totalAnswered = stats.correct_count + stats.incorrect_count;
    const accuracy = totalAnswered > 0
      ? Math.round((stats.correct_count / totalAnswered) * 100)
      : 0;

    const nextRetryPoints = Math.max(10, 50 - stats.retry_count * 10);

    res.json({
      totalPoints: stats.total_points,
      gamesPlayed: stats.games_played,
      correctCount: stats.correct_count,
      incorrectCount: stats.incorrect_count,
      accuracy,
      retryCount: stats.retry_count,
      nextRetryPoints,
    });
  } catch (err) {
    if (err instanceof UserError) {
      res.status(404).json({ error: err.message });
    } else {
      throw err;
    }
  }
});

/** POST /stats/reset — give the user points based on retry count (50, 40, 30, 20, then 10 minimum) */
router.post('/reset', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const db = getDb();

  // Get current retry count
  const stats = getStats(userId);
  const retryPoints = Math.max(10, 50 - stats.retry_count * 10);

  db.prepare(
    'UPDATE stats SET total_points = ?, retry_count = retry_count + 1 WHERE user_id = ?'
  ).run(retryPoints, userId);

  const nextRetryPoints = Math.max(10, 50 - (stats.retry_count + 1) * 10);

  res.json({
    message: 'Points reset',
    totalPoints: retryPoints,
    retryCount: stats.retry_count + 1,
    nextRetryPoints,
  });
});

export default router;
