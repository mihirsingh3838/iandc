import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  CircularProgress,
  Typography,
} from '@mui/material';
import { CameraAlt, Close, FlipCameraIos } from '@mui/icons-material';

const CameraComponent = ({ open, onClose, onCapture, maxImages, currentImages }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' for front, 'environment' for back
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open, facingMode]);

  const startCamera = async () => {
    try {
      setLoading(true);
      setError(null);
      setVideoReady(false);

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to play
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.error('Error playing video:', playError);
          // Video might still work even if play() throws
        }

        // Set up a timeout fallback to check if video is ready
        const checkVideoReady = () => {
          if (videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
            console.log('Video ready (timeout check)');
            setVideoReady(true);
            setLoading(false);
          }
        };

        // Check immediately
        setTimeout(checkVideoReady, 100);
        // Also check after a delay as fallback
        setTimeout(checkVideoReady, 1000);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setVideoReady(false);
    setLoading(false);
  };

  const capturePhoto = () => {
    try {
      if (!videoRef.current || !canvasRef.current) {
        console.error('Video or canvas ref not available');
        setError('Camera not ready. Please wait...');
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Check if video is ready and has dimensions
      if (!videoReady || video.videoWidth === 0 || video.videoHeight === 0) {
        console.error('Video not ready:', { 
          videoReady, 
          videoWidth: video.videoWidth, 
          videoHeight: video.videoHeight,
          readyState: video.readyState 
        });
        setError('Camera not ready. Please wait for the camera to load.');
        return;
      }

      const context = canvas.getContext('2d');
      if (!context) {
        console.error('Could not get canvas context');
        setError('Error initializing capture. Please try again.');
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64 directly (more reliable than blob conversion)
      try {
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        if (base64 && onCapture) {
          console.log('Image captured successfully, size:', base64.length);
          // Clear any previous errors
          setError(null);
          // Call the capture callback
          onCapture(base64);
        } else {
          console.error('Failed to get data URL or onCapture not provided');
          setError('Error processing image. Please try again.');
        }
      } catch (err) {
        console.error('Error converting canvas to data URL:', err);
        // Fallback: try blob method
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              console.error('Failed to create blob from canvas');
              setError('Failed to capture image. Please try again.');
              return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result;
              if (base64 && onCapture) {
                onCapture(base64);
              } else {
                console.error('Failed to read blob or onCapture not provided');
                setError('Error processing image. Please try again.');
              }
            };
            reader.onerror = () => {
              console.error('FileReader error');
              setError('Error reading image. Please try again.');
            };
            reader.readAsDataURL(blob);
          },
          'image/jpeg',
          0.9
        );
      }
    } catch (err) {
      console.error('Error capturing photo:', err);
      setError('Error capturing photo. Please try again.');
    }
  };

  const handleSwitchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundColor: '#000',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative', backgroundColor: '#000' }}>
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            },
          }}
        >
          <Close />
        </IconButton>

        {error ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              color: 'white',
              p: 3,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
              {error}
            </Typography>
            <Button variant="contained" onClick={handleClose}>
              Close
            </Button>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                backgroundColor: '#000',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
              }}
            >
              {(!videoReady || loading) && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'white',
                    textAlign: 'center',
                    zIndex: 5,
                    pointerEvents: 'none',
                  }}
                >
                  <CircularProgress sx={{ color: 'white', mb: 2 }} />
                  <Typography variant="body2">Loading camera...</Typography>
                </Box>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  console.log('Video metadata loaded', {
                    videoWidth: e.target.videoWidth,
                    videoHeight: e.target.videoHeight,
                    readyState: e.target.readyState
                  });
                  if (e.target.videoWidth > 0 && e.target.videoHeight > 0) {
                    setVideoReady(true);
                    setLoading(false);
                    setError(null);
                  }
                }}
                onPlaying={(e) => {
                  console.log('Video playing', {
                    videoWidth: e.target.videoWidth,
                    videoHeight: e.target.videoHeight,
                    readyState: e.target.readyState
                  });
                  if (e.target.videoWidth > 0 && e.target.videoHeight > 0) {
                    setVideoReady(true);
                    setLoading(false);
                    setError(null);
                  }
                }}
                onLoadedData={(e) => {
                  console.log('Video data loaded', {
                    videoWidth: e.target.videoWidth,
                    videoHeight: e.target.videoHeight,
                    readyState: e.target.readyState
                  });
                  if (e.target.videoWidth > 0 && e.target.videoHeight > 0) {
                    setVideoReady(true);
                    setLoading(false);
                    setError(null);
                  }
                }}
                onCanPlay={(e) => {
                  console.log('Video can play', {
                    videoWidth: e.target.videoWidth,
                    videoHeight: e.target.videoHeight,
                    readyState: e.target.readyState
                  });
                  if (e.target.videoWidth > 0 && e.target.videoHeight > 0) {
                    setVideoReady(true);
                    setLoading(false);
                    setError(null);
                  }
                }}
                onError={(e) => {
                  console.error('Video error:', e);
                  setError('Error loading camera feed. Please check permissions.');
                  setLoading(false);
                }}
                style={{
                  width: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  opacity: videoReady ? 1 : 0.3,
                }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
                p: 3,
                backgroundColor: '#000',
              }}
            >
              <IconButton
                onClick={handleSwitchCamera}
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                <FlipCameraIos />
              </IconButton>

              <Button
                variant="contained"
                onClick={capturePhoto}
                disabled={!videoReady || (currentImages && currentImages.length >= maxImages)}
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  minWidth: 64,
                  backgroundColor: videoReady ? 'white' : '#666',
                  '&:hover': {
                    backgroundColor: videoReady ? '#f0f0f0' : '#666',
                  },
                  '&:disabled': {
                    backgroundColor: '#666',
                    cursor: 'not-allowed',
                  },
                }}
              >
                <CameraAlt sx={{ color: videoReady ? '#000' : '#999', fontSize: 32 }} />
              </Button>

              <Box sx={{ width: 40 }} />
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CameraComponent;

