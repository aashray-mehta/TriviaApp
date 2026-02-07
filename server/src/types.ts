// ============================================================
// Shared types for the Trivia Game server
// ============================================================

/** A single trivia question as stored in JSON data files */
export interface TriviaQuestion {
  id: string;
  category: string;
  text: string;
  options: string[];
  correctIndex: number;
}

/** A user record in the database */
export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

/** Aggregated user statistics */
export interface UserStats {
  user_id: number;
  total_points: number;
  games_played: number;
  correct_count: number;
  incorrect_count: number;
  retry_count: number;
}

/** A pending round stored server-side while the user is answering */
export interface PendingRound {
  questionId: string;
  correctIndex: number;
  wager: number;
  category: string;
}

/** JWT payload */
export interface JwtPayload {
  userId: number;
  username: string;
}

/** Result returned to the client after submitting an answer */
export interface RoundResult {
  correct: boolean;
  pointsChange: number;
  correctAnswer: string;
  newTotal: number;
}
