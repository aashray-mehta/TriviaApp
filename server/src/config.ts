import path from 'path';

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'trivia-mvp-local-secret',
  jwtExpiresIn: '24h',
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'trivia.db'),
  questionsDir: path.join(__dirname, '..', 'data', 'questions'),
  bcryptRounds: 10,
  /** Number of recent question IDs to track per user to avoid repetition */
  recentQuestionsLimit: 20,
  /** Starting points for new users */
  startingPoints: 100,
};

export default config;
