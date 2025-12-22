import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Button,
  Typography,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { Logout, CameraAlt } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import CameraComponent from '../components/CameraComponent';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { user, logout: authLogout, validateToken } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [attendanceType, setAttendanceType] = useState('Check In');
  const [locationName, setLocationName] = useState('');
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [facilityDetails, setFacilityDetails] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    checkAuthentication();
    loadFacilityDetails();
    fetchAttendanceHistory();
    getLocation();
  }, []);

  const checkAuthentication = async () => {
    try {
      if (!user?.token) {
        navigate('/login');
        return;
      }
      
      const isValid = await validateToken(user.token);
      if (!isValid) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Authentication check error:', error);
      navigate('/login');
    }
  };

  const loadFacilityDetails = () => {
    try {
      const details = localStorage.getItem('facilityDetails');
      if (details) {
        setFacilityDetails(JSON.parse(details));
      }
    } catch (error) {
      console.error('Error loading facility details:', error);
    }
  };

  const getLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Call reverse geocoding API
            const response = await apiClient.get('/api/location/reverse-geocode', {
              params: { latitude, longitude }
            });
            setLocationName(response.data.locationName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          } catch (error) {
            console.error('Error reverse geocoding:', error);
            // Fallback to coordinates
            setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationName('Location unavailable');
        }
      );
    } else {
      setLocationName('Geolocation not supported');
    }
  };

  const handleLogout = async () => {
    try {
      await authLogout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error logging out');
    }
  };

  const handleImageCapture = async (base64Image) => {
    if (!base64Image) {
      console.error('No image data received');
      toast.error('Failed to capture image. Please try again.');
      return;
    }

    console.log('Image captured, length:', base64Image.length);
    setLoading(true);
    setShowCamera(false);

    try {
      if (!user?.token) {
        throw new Error('Not authenticated');
      }

      const response = await apiClient.post(
        '/api/attendance/mark',
        {
          attendanceType,
          location: {
            name: locationName || 'Unknown Location',
            latitude: 0,
            longitude: 0
          },
          selfieUrl: base64Image,
          facilityDetails
        }
      );

      if (response.data) {
        fetchAttendanceHistory();
        setAttendanceType(attendanceType === 'Check In' ? 'Check Out' : 'Check In');
        toast.success('Attendance marked successfully');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error(error.response?.data?.error || 'Error marking attendance');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    setHistoryLoading(true);
    try {
      if (!user?.token) {
        navigate('/login');
        return;
      }

      const response = await apiClient.get('/api/attendance/history');
      setAttendanceHistory(response.data);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error('Error fetching attendance history');
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <AppBar 
        position="static"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Home
          </Typography>
          <IconButton 
            color="inherit" 
            onClick={handleLogout}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Paper 
        sx={{ 
          mb: 1,
          borderRadius: 0,
        }}
      >
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '0.9375rem',
              fontWeight: 500,
              minHeight: 64,
            },
            '& .Mui-selected': {
              fontWeight: 600,
            },
          }}
        >
          <Tab label="Daily Attendance" />
          <Tab label="I&C Submission" />
        </Tabs>
      </Paper>

      <Container maxWidth="md" sx={{ mt: { xs: 2, sm: 3 }, pb: 4, px: { xs: 2, sm: 3 } }}>
        {activeTab === 0 ? (
          <Box>
            <Paper 
              sx={{ 
                p: { xs: 2, sm: 3 }, 
                mb: 3,
                borderRadius: 2,
              }}
            >
              <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
                Mark Attendance
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Logged in as:
                </Typography>
                <Typography variant="body1" fontWeight={500} sx={{ mb: 2 }}>
                  {user?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Location:
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {locationName || 'Fetching location...'}
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<CameraAlt />}
                disabled={loading || !locationName}
                onClick={() => setShowCamera(true)}
                fullWidth
                sx={{ 
                  mt: 2,
                  py: 1.5,
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  },
                  '&:disabled': {
                    background: '#e0e0e0',
                  },
                }}
              >
                {loading ? 'Processing...' : 'Reporting at site'}
              </Button>
            </Paper>

            <Paper 
              sx={{ 
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
              }}
            >
              <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
                Attendance History
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                Showing attendance for {user?.name}
              </Typography>
              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {attendanceHistory.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        No attendance records found for {user?.name}
                      </Typography>
                    </Box>
                  ) : (
                    attendanceHistory.map((record, index) => (
                      <Paper
                        key={index}
                        sx={{
                          mb: 1,
                          p: 2,
                          borderRadius: 1,
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            src={record.selfieUrl} 
                            sx={{ width: 56, height: 56 }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {record.attendanceType}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(record.timestamp).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {record.location.name}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    ))
                  )}
                </List>
              )}
            </Paper>
          </Box>
        ) : (
          <Paper 
            sx={{ 
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
            }}
          >
            <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
              Installation & Commissioning
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
              Submit installation and commissioning details including router, radio, and IT rack information.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                onClick={() => navigate('/ic-submission', { 
                  state: { facilityId: facilityDetails?.facility_code } 
                })}
                disabled={!facilityDetails}
                fullWidth
                sx={{ 
                  py: 1.5,
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  },
                  '&:disabled': {
                    background: '#e0e0e0',
                  },
                }}
              >
                Start I&C Submission
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/my-records')}
                fullWidth
                sx={{ 
                  py: 1.5,
                  fontSize: '1rem',
                  borderColor: '#667eea',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#764ba2',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                  },
                }}
              >
                View My I&C Records
              </Button>
              {(user?.role === 'admin' || user?.username === 'admin') && (
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin')}
                  fullWidth
                  sx={{ 
                    py: 1.5,
                    fontSize: '1rem',
                    borderColor: '#f44336',
                    color: '#f44336',
                    '&:hover': {
                      borderColor: '#d32f2f',
                      backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    },
                  }}
                >
                  Admin Dashboard
                </Button>
              )}
            </Box>
          </Paper>
        )}
      </Container>

      <CameraComponent
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleImageCapture}
        maxImages={1}
        currentImages={[]}
      />
    </Box>
  );
};

export default HomeScreen;

