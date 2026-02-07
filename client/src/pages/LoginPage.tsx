import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { register, login, ApiError } from '../api/client';

interface Props {
  onSuccess: (username: string) => void;
}

export default function LoginPage({ onSuccess }: Props) {
  const [tab, setTab] = useState(0); // 0 = login, 1 = register
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (tab === 1) {
        // Register
        await register(username, password);
        setSuccess('Account created! Logging you in...');
        // Auto-login after registration
        const result = await login(username, password);
        onSuccess(result.user.username);
      } else {
        // Login
        const result = await login(username, password);
        onSuccess(result.user.username);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Welcome to Trivia
      </Typography>

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(''); setSuccess(''); }} centered>
        <Tab label="Login" />
        <Tab label="Register" />
      </Tabs>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <TextField
          label="Username"
          fullWidth
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 3 }}
          inputProps={{ minLength: 4 }}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={loading}
        >
          {loading ? 'Please wait...' : tab === 0 ? 'Login' : 'Register'}
        </Button>
      </Box>
    </Paper>
  );
}
