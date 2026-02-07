import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';
import { getStats } from '../api/client';
import type { UserStatsResponse } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function StatsDialog({ open, onClose }: Props) {
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      getStats()
        .then(setStats)
        .catch(() => setStats(null))
        .finally(() => setLoading(false));
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Your Statistics</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : stats ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography>
              <strong>Points:</strong> {stats.totalPoints}
            </Typography>
            <Typography>
              <strong>Games Played:</strong> {stats.gamesPlayed}
            </Typography>
            <Typography>
              <strong>Correct Answers:</strong> {stats.correctCount}
            </Typography>
            <Typography>
              <strong>Incorrect Answers:</strong> {stats.incorrectCount}
            </Typography>
            <Typography>
              <strong>Accuracy:</strong> {stats.accuracy}%
            </Typography>
            <Typography>
              <strong>Retries Used:</strong> {stats.retryCount}
            </Typography>
          </Box>
        ) : (
          <Typography color="error">Failed to load stats.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
