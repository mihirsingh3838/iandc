import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Button,
  Typography,
  Grid,
  CircularProgress,
} from '@mui/material';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const FacilitySummaryScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateFacilityDetails, user, validateToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const facilityData = location.state?.facilityData;

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const storedUser = localStorage.getItem('userData');
      if (!storedUser) {
        navigate('/login');
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      const isValid = await validateToken(parsedUser.token);
      
      if (!isValid) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Authentication check error:', error);
      navigate('/login');
    }
  };

  const handleContinue = async () => {
    try {
      setLoading(true);

      if (!user?.token || !user?.loginId) {
        throw new Error('Not properly authenticated. Please login again.');
      }

      if (!facilityData) {
        throw new Error('No facility data available');
      }

      const formattedFacilityData = {
        district: facilityData.district,
        facility_type: facilityData.facility_type,
        facility_name: facilityData.facility_name,
        facility_code: facilityData.facility_code,
        Lat: facilityData.Lat || facilityData.latitude || 0,
        longitude: facilityData.longitude || 0
      };

      await updateFacilityDetails(formattedFacilityData);
      
      navigate('/home');
    } catch (err) {
      console.error('Error in handleContinue:', err);
      toast.error(err.message || 'Failed to update facility details');
      
      if (err.message.includes('Session expired') || err.message.includes('Not properly authenticated')) {
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!facilityData) {
    return (
      <Container>
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography>No facility data available</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6 },
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            padding: { xs: 3, sm: 4, md: 5 },
            width: '100%',
            borderRadius: 3,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom align="center" fontWeight="bold">
            Facility Information
          </Typography>

          <Box
            sx={{
              backgroundColor: '#f8f8f8',
              borderRadius: 2,
              padding: 2,
              mt: 3,
              mb: 3,
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography fontWeight="bold" color="text.secondary" variant="body2">
                  District:
                </Typography>
              </Grid>
              <Grid item xs={12} sm={8}>
                <Typography variant="body1">{facilityData.district}</Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography fontWeight="bold" color="text.secondary" variant="body2">
                  Type:
                </Typography>
              </Grid>
              <Grid item xs={12} sm={8}>
                <Typography variant="body1">{facilityData.facility_type}</Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography fontWeight="bold" color="text.secondary" variant="body2">
                  Name:
                </Typography>
              </Grid>
              <Grid item xs={12} sm={8}>
                <Typography variant="body1">{facilityData.facility_name}</Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography fontWeight="bold" color="text.secondary" variant="body2">
                  Code:
                </Typography>
              </Grid>
              <Grid item xs={12} sm={8}>
                <Typography variant="body1">{facilityData.facility_code}</Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography fontWeight="bold" color="text.secondary" variant="body2">
                  Latitude:
                </Typography>
              </Grid>
              <Grid item xs={12} sm={8}>
                <Typography variant="body1">{facilityData.Lat || facilityData.latitude || 0}</Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography fontWeight="bold" color="text.secondary" variant="body2">
                  Longitude:
                </Typography>
              </Grid>
              <Grid item xs={12} sm={8}>
                <Typography variant="body1">{facilityData.longitude || 0}</Typography>
              </Grid>
            </Grid>
          </Box>

          <Button
            fullWidth
            variant="contained"
            onClick={handleContinue}
            disabled={loading}
            sx={{ 
              mt: 3, 
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              },
              '&:disabled': {
                background: '#e0e0e0',
              },
            }}
            size="large"
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Continue to Home'}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default FacilitySummaryScreen;

