import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Paper,
  Button,
} from '@mui/material';
import CategoryPicker from '../components/CategoryPicker';
import WagerInput from '../components/WagerInput';
import QuestionView from '../components/QuestionView';
import ResultView from '../components/ResultView';
import { getCategories, submitWager, submitAnswer, getStats, resetPoints, ApiError } from '../api/client';
import type { QuestionPayload, RoundResult, UserStatsResponse } from '../types';

type GamePhase = 'category' | 'wager' | 'question' | 'result';

export default function GamePage() {
  const [phase, setPhase] = useState<GamePhase>('category');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPoints, setCurrentPoints] = useState(0);
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nextRetryPoints, setNextRetryPoints] = useState(50);

  // Load categories and current points on mount
  useEffect(() => {
    (async () => {
      try {
        const [cats, stats] = await Promise.all([getCategories(), getStats()]);
        setCategories(cats);
        setCurrentPoints(stats.totalPoints);
        setNextRetryPoints(stats.nextRetryPoints);
      } catch (err) {
        setError('Failed to load game data');
      }
    })();
  }, []);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setError('');
    setPhase('wager');
  };

  const handleWager = async (wager: number) => {
    setLoading(true);
    setError('');
    try {
      const q = await submitWager(selectedCategory, wager);
      setQuestion(q);
      setPhase('question');
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Failed to start round');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (chosenIndex: number) => {
    if (!question) return;
    setLoading(true);
    setError('');
    try {
      const r = await submitAnswer(question.questionId, chosenIndex);
      setResult(r);
      setCurrentPoints(r.newTotal);
      setPhase('result');
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAgain = () => {
    setQuestion(null);
    setResult(null);
    setError('');
    setPhase('category');
  };

  return (
    <Box>
      <Typography variant="h6" align="center" sx={{ mb: 1 }}>
        Points: {currentPoints}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {phase === 'category' && currentPoints === 0 && (
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You have 0 points and cannot place a wager.
          </Alert>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You've run out of points! Click below to get <strong>{nextRetryPoints}</strong> points and keep playing.
          </Typography>
          <Button
            variant="contained"
            size="large"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setError('');
              try {
                const data = await resetPoints();
                setCurrentPoints(data.totalPoints);
                setNextRetryPoints(data.nextRetryPoints);
              } catch (err) {
                if (err instanceof ApiError) setError(err.message);
                else setError('Failed to reset points');
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? 'Please wait...' : 'Try Again'}
          </Button>
        </Paper>
      )}

      {phase === 'category' && currentPoints > 0 && (
        <CategoryPicker categories={categories} onSelect={handleCategorySelect} />
      )}

      {phase === 'wager' && (
        <WagerInput
          category={selectedCategory}
          maxPoints={currentPoints}
          onSubmit={handleWager}
          onBack={() => setPhase('category')}
          loading={loading}
        />
      )}

      {phase === 'question' && question && (
        <QuestionView
          question={question}
          onAnswer={handleAnswer}
          loading={loading}
        />
      )}

      {phase === 'result' && result && (
        <ResultView result={result} onPlayAgain={handlePlayAgain} />
      )}
    </Box>
  );
}
