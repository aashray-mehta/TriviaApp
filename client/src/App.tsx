import { useState, useCallback } from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import LoginPage from './pages/LoginPage';
import GamePage from './pages/GamePage';
import StatsDialog from './components/StatsDialog';
import { logout, getToken } from './api/client';

type View = 'login' | 'game';

export default function App() {
  const [view, setView] = useState<View>(getToken() ? 'game' : 'login');
  const [username, setUsername] = useState<string>('');
  const [statsOpen, setStatsOpen] = useState(false);

  const handleLoginSuccess = useCallback((name: string) => {
    setUsername(name);
    setView('game');
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setUsername('');
    setView('login');
  }, []);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Trivia Game
          </Typography>
          {view === 'game' && (
            <>
              <Typography variant="body1" sx={{ mr: 2 }}>
                {username}
              </Typography>
              <Button color="inherit" onClick={() => setStatsOpen(true)}>
                Stats
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 4 }}>
        {view === 'login' ? (
          <LoginPage onSuccess={handleLoginSuccess} />
        ) : (
          <GamePage />
        )}
      </Container>

      <StatsDialog open={statsOpen} onClose={() => setStatsOpen(false)} />
    </>
  );
}
