import { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Chip,
} from '@mui/material';

interface Props {
  category: string;
  maxPoints: number;
  onSubmit: (wager: number) => void;
  onBack: () => void;
  loading: boolean;
}

export default function WagerInput({ category, maxPoints, onSubmit, onBack, loading }: Props) {
  const [wager, setWager] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(wager, 10);
    if (val > 0 && val <= maxPoints) {
      onSubmit(val);
    }
  };

  const quickAmounts = [10, 25, 50].filter((a) => a <= maxPoints);

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Place Your Wager
      </Typography>
      <Typography variant="body1" sx={{ mb: 1 }}>
        Category: <strong>{category}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Available points: {maxPoints}
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        {quickAmounts.map((amt) => (
          <Chip
            key={amt}
            label={amt}
            onClick={() => setWager(String(amt))}
            color={wager === String(amt) ? 'primary' : 'default'}
            clickable
          />
        ))}
      </Box>

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Wager"
          type="number"
          fullWidth
          value={wager}
          onChange={(e) => setWager(e.target.value)}
          inputProps={{ min: 1, max: maxPoints }}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={onBack} disabled={loading}>
            Back
          </Button>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !wager || parseInt(wager) < 1 || parseInt(wager) > maxPoints}
          >
            {loading ? 'Loading...' : 'Submit Wager'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
