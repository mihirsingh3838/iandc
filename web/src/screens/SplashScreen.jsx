import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Fade } from '@mui/material';

const SplashScreen = () => {
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Preload the image
    const img = new Image();
    img.src = "https://i.ibb.co/qFCz1jSY/iandc.jpg";
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true); // Continue even if image fails
  }, []);

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
          src="https://i.ibb.co/qFCz1jSY/iandc.jpg"
          alt="I&C Logo"
          loading="eager"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          sx={{
            width: '70%',
            maxWidth: '400px',
            height: 'auto',
            objectFit: 'contain',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in',
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

