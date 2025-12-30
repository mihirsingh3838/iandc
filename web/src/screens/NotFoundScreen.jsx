import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
} from '@mui/material';
import { Home, ArrowBack } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const NotFoundScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
    if (user) {
      // If user is logged in, go to appropriate home page
      if (user.role === 'admin' || user.username === 'admin') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    } else {
      // If not logged in, go to login page
      navigate('/login');
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: { xs: 2, sm: 3 },
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            padding: { xs: 3, sm: 4, md: 5 },
            textAlign: 'center',
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.98)',
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '6rem', sm: '8rem', md: '10rem' },
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
              lineHeight: 1,
            }}
          >
            404
          </Typography>

          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 600,
              mb: 2,
              color: 'text.primary',
            }}
          >
            Page Not Found
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mb: 4,
              fontSize: '1.1rem',
              lineHeight: 1.7,
            }}
          >
            Oops! The page you're looking for doesn't exist or has been moved.
            <br />
            Let's get you back on track.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<Home />}
              onClick={handleGoHome}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                },
              }}
            >
              {user ? 'Go to Home' : 'Go to Login'}
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowBack />}
              onClick={handleGoBack}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1rem',
                fontWeight: 600,
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#764ba2',
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                },
              }}
            >
              Go Back
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default NotFoundScreen;

