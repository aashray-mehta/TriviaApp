import {
  Paper,
  Typography,
  Button,
  Alert,
  Box,
} from '@mui/material';
import type { RoundResult } from '../types';

interface Props {
  result: RoundResult;
  onPlayAgain: () => void;
}

export default function ResultView({ result, onPlayAgain }: Props) {
  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Alert severity={result.correct ? 'success' : 'error'} sx={{ mb: 2 }}>
        {result.correct ? 'Correct!' : 'Incorrect!'}
      </Alert>

      <Typography variant="body1" sx={{ mb: 1 }}>
        <strong>Correct answer:</strong> {result.correctAnswer}
      </Typography>
      <Typography variant="body1" sx={{ mb: 1 }}>
        <strong>Points {result.correct ? 'gained' : 'lost'}:</strong>{' '}
        {Math.abs(result.pointsChange)}
      </Typography>
      <Typography variant="h6" sx={{ mb: 3 }}>
        New total: {result.newTotal} points
      </Typography>

      <Box sx={{ textAlign: 'center' }}>
        <Button variant="contained" size="large" onClick={onPlayAgain}>
          Play Again
        </Button>
      </Box>
    </Paper>
  );
}
