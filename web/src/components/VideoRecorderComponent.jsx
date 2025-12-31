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
import { Videocam, Stop, Close, FlipCameraIos } from '@mui/icons-material';

const VideoRecorderComponent = ({ open, onClose, onRecord, minDuration = 30, maxDuration = 45 }) => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const [facingMode, setFacingMode] = useState('environment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimeRef = useRef(0); // Use ref to preserve time during async operations
  const [maxSizeReached, setMaxSizeReached] = useState(false);

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

  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          recordingTimeRef.current = newTime; // Update ref as well
          // Stop recording if max duration reached
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);
    }
    // Don't reset recordingTime to 0 here - let it persist until we process the video

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, maxDuration]);

  const startCamera = async () => {
    try {
      setLoading(true);
      setError(null);
      setVideoReady(false);
      setMaxSizeReached(false);

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.error('Error playing video:', playError);
        }

        const checkVideoReady = () => {
          if (videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
            setVideoReady(true);
            setLoading(false);
          }
        };

        setTimeout(checkVideoReady, 100);
        setTimeout(checkVideoReady, 1000);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setVideoReady(false);
    setLoading(false);
    setIsRecording(false);
    setRecordingTime(0);
    chunksRef.current = [];
    setMaxSizeReached(false);
  };

  const startRecording = () => {
    if (!videoRef.current || !streamRef.current) {
      setError('Camera not ready. Please wait...');
      return;
    }

    try {
      chunksRef.current = [];
      setMaxSizeReached(false);

      const options = {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2000000 // 2Mbps for compression
      };

      // Fallback to default if codec not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          
          // Check total size (20MB limit)
          const totalSize = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
          if (totalSize > 20 * 1024 * 1024) {
            setMaxSizeReached(true);
            stopRecording();
            setError('Video size limit reached (20MB). Recording stopped.');
          }
        }
      };

      mediaRecorder.onstop = async () => {
        if (chunksRef.current.length === 0) {
          setError('No video data recorded.');
          setIsRecording(false);
          setRecordingTime(0);
          return;
        }

        // Store the recording time from ref (more reliable than state during async)
        const finalRecordingTime = recordingTimeRef.current || recordingTime;
        console.log('Recording stopped. Captured time:', finalRecordingTime, 'State time:', recordingTime);
        setIsRecording(false);

        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        
        // Check final size
        if (blob.size > 20 * 1024 * 1024) {
          setError('Video size exceeds 20MB limit. Please record a shorter video.');
          return;
        }

        // Verify duration first before converting to base64
        const videoUrl = URL.createObjectURL(blob);
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = videoUrl;

        const checkDuration = () => {
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              // Use recording time as fallback on timeout
              console.log('Timeout waiting for video metadata, using recording time:', finalRecordingTime);
              resolve(finalRecordingTime);
            }, 3000);

            video.onloadedmetadata = () => {
              clearTimeout(timeout);
              const duration = video.duration;
              
              // Check if duration is valid (not NaN or Infinity)
              if (isNaN(duration) || !isFinite(duration) || duration <= 0) {
                // Use recording time as fallback
                console.log('Video duration not available, using recording time:', finalRecordingTime);
                resolve(finalRecordingTime);
              } else {
                console.log('Video duration from metadata:', duration);
                resolve(duration);
              }
            };

            video.onerror = (e) => {
              clearTimeout(timeout);
              // Use recording time as fallback
              console.log('Error loading video metadata, using recording time:', finalRecordingTime);
              resolve(finalRecordingTime);
            };

            // Force load
            video.load();
          });
        };

        try {
          const duration = await checkDuration();
          URL.revokeObjectURL(videoUrl);

          console.log('Final duration for validation:', duration, 'Recording time was:', finalRecordingTime);

          // Validate duration - use the larger of the two to be safe
          const durationToCheck = Math.max(duration, finalRecordingTime);
          
          if (durationToCheck < minDuration || durationToCheck > maxDuration) {
            setError(`Video must be between ${minDuration} and ${maxDuration} seconds. Current: ${Math.round(durationToCheck)}s`);
            return;
          }

          // Convert to base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Video = reader.result;
            setRecordingTime(0); // Reset after successful processing
            if (onRecord) {
              onRecord(base64Video);
            }
          };
          reader.onerror = () => {
            setRecordingTime(0);
            setError('Error reading video. Please try again.');
          };
          reader.readAsDataURL(blob);
        } catch (err) {
          URL.revokeObjectURL(videoUrl);
          console.error('Error checking video duration:', err);
          // Use recording time as fallback
          if (finalRecordingTime >= minDuration && finalRecordingTime <= maxDuration) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Video = reader.result;
              setRecordingTime(0); // Reset after successful processing
              if (onRecord) {
                onRecord(base64Video);
              }
            };
            reader.onerror = () => {
              setRecordingTime(0);
              setError('Error reading video. Please try again.');
            };
            reader.readAsDataURL(blob);
          } else {
            setRecordingTime(0);
            setError(`Video must be between ${minDuration} and ${maxDuration} seconds. Recorded: ${finalRecordingTime}s`);
          }
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Error recording video. Please try again.');
        setIsRecording(false);
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Error starting recording. Please try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSwitchCamera = () => {
    if (!isRecording) {
      setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            <Button variant="contained" onClick={() => setError(null)}>
              Try Again
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

              {isRecording && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    zIndex: 10,
                    backgroundColor: 'rgba(255, 0, 0, 0.7)',
                    color: 'white',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      animation: 'pulse 1s infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.5 },
                      },
                    }}
                  />
                  <Typography variant="body2" fontWeight="bold">
                    {formatTime(recordingTime)} / {formatTime(maxDuration)}
                  </Typography>
                </Box>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  if (e.target.videoWidth > 0 && e.target.videoHeight > 0) {
                    setVideoReady(true);
                    setLoading(false);
                    setError(null);
                  }
                }}
                onPlaying={(e) => {
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
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
                p: 3,
                backgroundColor: '#000',
              }}
            >
              <Typography variant="body2" sx={{ color: 'white', textAlign: 'center' }}>
                Record a video between {minDuration} and {maxDuration} seconds
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <IconButton
                  onClick={handleSwitchCamera}
                  disabled={isRecording}
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:disabled': {
                      opacity: 0.5,
                    },
                  }}
                >
                  <FlipCameraIos />
                </IconButton>

                {!isRecording ? (
                  <Button
                    variant="contained"
                    onClick={startRecording}
                    disabled={!videoReady}
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      minWidth: 64,
                      backgroundColor: videoReady ? '#f44336' : '#666',
                      '&:hover': {
                        backgroundColor: videoReady ? '#d32f2f' : '#666',
                      },
                      '&:disabled': {
                        backgroundColor: '#666',
                        cursor: 'not-allowed',
                      },
                    }}
                  >
                    <Videocam sx={{ color: 'white', fontSize: 32 }} />
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={stopRecording}
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      minWidth: 64,
                      backgroundColor: '#f44336',
                      '&:hover': {
                        backgroundColor: '#d32f2f',
                      },
                    }}
                  >
                    <Stop sx={{ color: 'white', fontSize: 32 }} />
                  </Button>
                )}

                <Box sx={{ width: 40 }} />
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VideoRecorderComponent;

