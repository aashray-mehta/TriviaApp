/**
 * Thin API client for the trivia server.
 * All endpoints go through the Vite dev-server proxy so base URL is just "/".
 */

import type {
  LoginResponse,
  QuestionPayload,
  RoundResult,
  UserStatsResponse,
} from '../types';

// ---- token management (in-memory for POC) ----
let token: string | null = localStorage.getItem('trivia_token');

export function setToken(t: string | null): void {
  token = t;
  if (t) {
    localStorage.setItem('trivia_token', t);
  } else {
    localStorage.removeItem('trivia_token');
  }
}

export function getToken(): string | null {
  return token;
}

// ---- helpers ----
async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(body.error || res.statusText, res.status);
  }
  return body as T;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ---- auth ----
export async function register(username: string, password: string): Promise<void> {
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const data = await request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  return data;
}

export function logout(): void {
  setToken(null);
}

// ---- game ----
export async function getCategories(): Promise<string[]> {
  const data = await request<{ categories: string[] }>('/game/categories');
  return data.categories;
}

export async function submitWager(
  category: string,
  wager: number
): Promise<QuestionPayload> {
  return request<QuestionPayload>('/game/wager', {
    method: 'POST',
    body: JSON.stringify({ category, wager }),
  });
}

export async function submitAnswer(
  questionId: string,
  chosenIndex: number
): Promise<RoundResult> {
  return request<RoundResult>('/game/submit', {
    method: 'POST',
    body: JSON.stringify({ questionId, chosenIndex }),
  });
}

// ---- stats ----
export async function getStats(): Promise<UserStatsResponse> {
  return request<UserStatsResponse>('/stats');
}

export async function resetPoints(): Promise<{ totalPoints: number; retryCount: number; nextRetryPoints: number }> {
  return request<{ totalPoints: number; retryCount: number; nextRetryPoints: number }>('/stats/reset', { method: 'POST' });
}
