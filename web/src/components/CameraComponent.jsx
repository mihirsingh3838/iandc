import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  CircularProgress,
  Typography,
  LinearProgress,
} from '@mui/material';
import { CameraAlt, Close, FlipCameraIos } from '@mui/icons-material';
import { compressImage } from '../utils/imageCompression';

const CameraComponent = ({ open, onClose, onCapture, maxImages, currentImages }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' for front, 'environment' for back
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);

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

  const capturePhoto = async () => {
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

      // Convert to base64 first
      let base64;
      try {
        base64 = canvas.toDataURL('image/jpeg', 0.9);
        if (!base64) {
          throw new Error('Failed to get data URL');
        }
      } catch (err) {
        console.error('Error converting canvas to data URL:', err);
        // Fallback: try blob method
        base64 = await new Promise((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob from canvas'));
                return;
              }
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = () => reject(new Error('FileReader error'));
              reader.readAsDataURL(blob);
            },
            'image/jpeg',
            0.9
          );
        });
      }

      if (!base64) {
        setError('Failed to capture image. Please try again.');
        return;
      }

      // Compress the image
      setCompressing(true);
      setCompressionProgress(0);
      setError(null);

      try {
        // Simulate progress (compression is async)
        const progressInterval = setInterval(() => {
          setCompressionProgress((prev) => Math.min(prev + 10, 90));
        }, 100);

        const compressedBase64 = await compressImage(base64, 1920, 1080, 0.8, 500);
        
        clearInterval(progressInterval);
        setCompressionProgress(100);

        // Small delay to show 100% progress
        await new Promise(resolve => setTimeout(resolve, 200));

        if (compressedBase64 && onCapture) {
          console.log('Image captured and compressed successfully');
          onCapture(compressedBase64);
          setShowCamera(false);
        } else {
          setError('Error processing compressed image. Please try again.');
        }
      } catch (compressionError) {
        console.error('Error compressing image:', compressionError);
        // If compression fails, use original image
        if (onCapture) {
          console.warn('Using uncompressed image due to compression error');
          onCapture(base64);
          setShowCamera(false);
        } else {
          setError('Error compressing image. Please try again.');
        }
      } finally {
        setCompressing(false);
        setCompressionProgress(0);
      }
    } catch (err) {
      console.error('Error capturing photo:', err);
      setError(`Error capturing photo: ${err.message || 'Please try again.'}`);
      setCompressing(false);
      setCompressionProgress(0);
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
        ) : compressing ? (
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
            <CircularProgress sx={{ color: 'white', mb: 2 }} />
            <Typography variant="body1" sx={{ mb: 1, textAlign: 'center' }}>
              Compressing image...
            </Typography>
            <Box sx={{ width: '80%', maxWidth: 300, mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={compressionProgress} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'white',
                  },
                }} 
              />
              <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', display: 'block' }}>
                {compressionProgress}%
              </Typography>
            </Box>
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
                disabled={!videoReady || compressing || (currentImages && currentImages.length >= maxImages)}
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  minWidth: 64,
                  backgroundColor: (videoReady && !compressing) ? 'white' : '#666',
                  '&:hover': {
                    backgroundColor: (videoReady && !compressing) ? '#f0f0f0' : '#666',
                  },
                  '&:disabled': {
                    backgroundColor: '#666',
                    cursor: 'not-allowed',
                  },
                }}
              >
                <CameraAlt sx={{ color: (videoReady && !compressing) ? '#000' : '#999', fontSize: 32 }} />
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

