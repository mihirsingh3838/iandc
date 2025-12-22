import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Fade } from '@mui/material';

const SplashScreen = () => {
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeIn(false);
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Fade in={fadeIn} timeout={1000}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#fff',
        }}
      >
        <Box
          component="img"
          src="/logo.png"
          alt="Logo"
          sx={{
            width: '70%',
            maxWidth: '400px',
            height: 'auto',
          }}
        />
        <Box
          component="p"
          sx={{
            marginTop: 2,
            fontSize: 16,
            color: '#666',
            fontStyle: 'italic',
          }}
        >
          powered by bluetown
        </Box>
      </Box>
    </Fade>
  );
};

export default SplashScreen;

