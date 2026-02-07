import { Router, Request, Response } from 'express';
import { registerUser, loginUser, UserError } from '../services/auth';

const router = Router();

/** POST /auth/register */
router.post('/register', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    res.status(400).json({ error: 'Username is required' });
    return;
  }
  if (!password || typeof password !== 'string' || password.length < 4) {
    res.status(400).json({ error: 'Password must be at least 4 characters' });
    return;
  }

  try {
    const userId = registerUser(username.trim(), password);
    res.status(201).json({ message: 'User registered', userId });
  } catch (err) {
    if (err instanceof UserError) {
      res.status(409).json({ error: err.message });
    } else {
      throw err;
    }
  }
});

/** POST /auth/login */
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  try {
    const result = loginUser(username.trim(), password);
    res.json(result);
  } catch (err) {
    if (err instanceof UserError) {
      res.status(401).json({ error: err.message });
    } else {
      throw err;
    }
  }
});

/** POST /auth/logout — for MVP the client simply discards the token */
router.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Logged out' });
});

export default router;
