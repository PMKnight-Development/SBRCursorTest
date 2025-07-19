import React, { useState } from 'react';
import { Avatar, Button, TextField, Typography, Paper, Box, CircularProgress } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../components/AuthProvider';
// import styles from '../styles/Login.module.css';

const Login: React.FC = () => {
  const { login, loading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with:', { username, password: '***' });
    await login(username, password);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
    }}>
      <Paper elevation={6} sx={{ 
        padding: '2.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
        borderRadius: 2,
        boxShadow: '0 8px 32px rgba(30,60,114,0.15)',
        background: '#fff'
      }}>
        <Avatar sx={{ margin: 0.5, backgroundColor: '#1e3c72' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          SBR CAD Login
        </Typography>
        <form style={{ width: '100%', marginTop: '1rem' }} onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Username"
            autoFocus
            autoComplete="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {error && <Typography color="error" variant="body2">{error}</Typography>}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2, fontWeight: 600, letterSpacing: '0.05em' }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login; 