import express from 'express';
import cors from 'cors';
import config from './config';
import { initDb } from './db';
import { loadAllQuestions } from './services/questions';
import authRoutes from './routes/auth';
import gameRoutes from './routes/game';
import statsRoutes from './routes/stats';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json({ limit: '100kb' }));

// --------------- Routes ---------------
app.use('/auth', authRoutes);
app.use('/game', gameRoutes);
app.use('/stats', statsRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// --------------- Error handler (must be last) ---------------
app.use(errorHandler);

// --------------- Start ---------------
function start() {
  initDb();
  loadAllQuestions();
  app.listen(config.port, () => {
    console.log(`Trivia server listening on http://localhost:${config.port}`);
  });
}

// Only start if this file is run directly (not imported for tests)
if (require.main === module) {
  start();
}

export { app, start };
