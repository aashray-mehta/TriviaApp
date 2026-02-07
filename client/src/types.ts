// Shared types for the client

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
  };
}

export interface QuestionPayload {
  questionId: string;
  text: string;
  options: string[];
}

export interface RoundResult {
  correct: boolean;
  pointsChange: number;
  correctAnswer: string;
  newTotal: number;
}

export interface UserStatsResponse {
  totalPoints: number;
  gamesPlayed: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  retryCount: number;
  nextRetryPoints: number;
}
