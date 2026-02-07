import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { getCategories } from '../services/questions';
import { startRound, submitAnswer } from '../services/game';
import { UserError } from '../services/auth';

const router = Router();

// All game routes require authentication
router.use(requireAuth);

/** GET /game/categories */
router.get('/categories', (_req: Request, res: Response) => {
  const categories = getCategories();
  res.json({ categories });
});

/** POST /game/wager — start a round */
router.post('/wager', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { category, wager } = req.body;

  if (!category || typeof category !== 'string') {
    res.status(400).json({ error: 'Category is required' });
    return;
  }

  const parsedWager = Number(wager);
  if (!Number.isFinite(parsedWager) || parsedWager <= 0) {
    res.status(400).json({ error: 'Wager must be a positive number' });
    return;
  }

  try {
    const question = startRound(userId, category, Math.floor(parsedWager));
    res.json(question);
  } catch (err) {
    if (err instanceof UserError) {
      res.status(400).json({ error: err.message });
    } else {
      throw err;
    }
  }
});

/** POST /game/submit — submit an answer */
router.post('/submit', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { questionId, chosenIndex } = req.body;

  if (!questionId || typeof questionId !== 'string') {
    res.status(400).json({ error: 'questionId is required' });
    return;
  }

  const idx = Number(chosenIndex);
  if (!Number.isFinite(idx) || idx < 0) {
    res.status(400).json({ error: 'chosenIndex must be a non-negative integer' });
    return;
  }

  try {
    const result = submitAnswer(userId, questionId, Math.floor(idx));
    res.json(result);
  } catch (err) {
    if (err instanceof UserError) {
      res.status(400).json({ error: err.message });
    } else {
      throw err;
    }
  }
});

export default router;
