import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Button,
  Typography,
  Grid,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import { ArrowBack, Home } from '@mui/icons-material';
import { toast } from 'react-toastify';
import icSubmissionService from '../services/icSubmissionService';
import apiClient from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';

const ImagePreview = ({ images, size = 'small' }) => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}>
    {images?.map((image, index) => (
      <Box
        key={index}
        component="img"
        src={typeof image === 'string' ? image : image.url || image}
        alt={`Preview ${index + 1}`}
        sx={{
          width: size === 'small' ? { xs: 50, sm: 60 } : { xs: 80, sm: 100 },
          height: size === 'small' ? { xs: 50, sm: 60 } : { xs: 80, sm: 100 },
          borderRadius: 1.5,
          objectFit: 'cover',
          border: '2px solid',
          borderColor: 'divider',
        }}
      />
    ))}
  </Box>
);

const PreviewSection = ({ title, children }) => (
  <Paper 
    sx={{ 
      p: { xs: 2, sm: 3 },
      mb: 2,
      borderRadius: 2,
    }}
  >
    <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
      {title}
    </Typography>
    {children}
  </Paper>
);

const ICPreviewScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get('id');
  const { customerEnd, towerEnd, facilityId } = location.state || {};
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  useEffect(() => {
    if (submissionId) {
      fetchSubmission(submissionId);
    } else if (customerEnd && towerEnd) {
      setSubmissionData({ customerEnd, towerEnd, facilityId });
      setViewMode(false);
    }
  }, [submissionId, customerEnd, towerEnd, facilityId]);

  const fetchSubmission = async (id) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/ic-submission/submission/${id}`);
      setSubmissionData(response.data);
      setViewMode(true);
    } catch (error) {
      console.error('Error fetching submission:', error);
      toast.error('Error loading submission');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!submissionData) return;
    try {
      setSubmitting(true);
      await icSubmissionService.submit(
        submissionData.facilityId || facilityId,
        submissionData.customerEnd || customerEnd,
        submissionData.towerEnd || towerEnd,
        user?.token
      );
      toast.success('Submission successful');
      navigate('/home');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Error submitting form');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!submissionData) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => navigate('/home')} sx={{ mr: 2 }}>
              <Home />
            </IconButton>
            <Typography variant="h6">No Data Available</Typography>
          </Toolbar>
        </AppBar>
        <Container sx={{ mt: 4 }}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>No submission data found</Typography>
            <Button variant="contained" onClick={() => navigate('/home')} sx={{ mt: 2 }}>
              Go to Home
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  const displayCustomerEnd = submissionData.customerEnd || customerEnd;
  const displayTowerEnd = submissionData.towerEnd || towerEnd;
  const displayFacilityId = submissionData.facilityId || facilityId;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <AppBar 
        position="static"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => {
              if (user?.role === 'admin' || user?.username === 'admin') {
                navigate('/admin');
              } else {
                navigate('/ic-submission');
              }
            }}
            sx={{
              mr: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Preview Submission
          </Typography>
          <IconButton
            color="inherit"
            onClick={() => navigate('/home')}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <Home />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          fontWeight="bold"
          sx={{ mb: 3, mt: 2 }}
        >
          Customer End Details
        </Typography>

      {displayCustomerEnd?.router && (
        <PreviewSection title="Router Details">
          <Typography>Type: {displayCustomerEnd.router.routerType}</Typography>
          <Typography>Serial Number: {displayCustomerEnd.router.serialNumber}</Typography>
          <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Router Images:</Typography>
          <ImagePreview images={displayCustomerEnd.router.images?.routerImages} />
          <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Cable Connectivity Images:</Typography>
          <ImagePreview images={displayCustomerEnd.router.images?.cableConnectivityImages} />
        </PreviewSection>
      )}

      {displayCustomerEnd?.radio && (
        <PreviewSection title="Radio Details">
          <Typography>Type: {displayCustomerEnd.radio.radioType}</Typography>
          <Typography>Serial Number: {displayCustomerEnd.radio.serialNumber}</Typography>
          <Typography>
            LAN Cable Reading: {displayCustomerEnd.radio.lanCableReading?.start} - {displayCustomerEnd.radio.lanCableReading?.end}
          </Typography>
          <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Images:</Typography>
          <ImagePreview images={displayCustomerEnd.radio.images} />
        </PreviewSection>
      )}

          {displayCustomerEnd?.itRacks && displayCustomerEnd.itRacks.length > 0 && (
        <PreviewSection title="IT Rack Details">
          {displayCustomerEnd.itRacks.map((rack, index) => (
            <Paper 
              key={index} 
              sx={{ 
                p: { xs: 1.5, sm: 2 }, 
                mb: 1.5, 
                backgroundColor: '#f5f5f5',
                borderRadius: 1.5,
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Rack {rack.rackNumber}
              </Typography>
              <Typography>Type: {rack.rackType}</Typography>
              <Typography>Floor: {rack.floor}</Typography>
              <Typography>Location: {rack.location}</Typography>
              <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Images:</Typography>
              <ImagePreview images={rack.images} />
            </Paper>
          ))}
        </PreviewSection>
      )}

      {displayCustomerEnd?.aps && displayCustomerEnd.aps.length > 0 && (
        <PreviewSection title="AP Details">
          {displayCustomerEnd.aps.map((ap, index) => (
            <Paper key={index} sx={{ p: 2, mb: 1, backgroundColor: '#f5f5f5' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                AP {ap.apNumber}
              </Typography>
              <Typography>Make: {ap.make}</Typography>
              <Typography>Model: {ap.model}</Typography>
              <Typography>Serial Number: {ap.serialNumber}</Typography>
              <Typography>Floor: {ap.floor}</Typography>
              <Typography>
                LAN Cable Reading: {ap.lanCableReading?.start} - {ap.lanCableReading?.end}
              </Typography>
              <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Images:</Typography>
              <ImagePreview images={ap.images} />
            </Paper>
          ))}
        </PreviewSection>
      )}

      {displayCustomerEnd?.poeSwitches && displayCustomerEnd.poeSwitches.length > 0 && (
        <PreviewSection title="POE Switch Details">
          {displayCustomerEnd.poeSwitches.map((poe, index) => (
            <Paper key={index} sx={{ p: 2, mb: 1, backgroundColor: '#f5f5f5' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                POE Switch {poe.poeNumber}
              </Typography>
              <Typography>Make: {poe.make}</Typography>
              <Typography>Model: {poe.model}</Typography>
              <Typography>Serial Number: {poe.serialNumber}</Typography>
              <Typography>IT Rack: {poe.itRackNumber}</Typography>
              <Typography>Location: {poe.location}</Typography>
              <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Images:</Typography>
              <ImagePreview images={poe.images} />
            </Paper>
          ))}
        </PreviewSection>
      )}

      {displayCustomerEnd?.desktopSwitches && displayCustomerEnd.desktopSwitches.length > 0 && (
        <PreviewSection title="Desktop Switch Details">
          {displayCustomerEnd.desktopSwitches.map((desktop, index) => (
            <Paper key={index} sx={{ p: 2, mb: 1, backgroundColor: '#f5f5f5' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Desktop Switch {desktop.desktopNumber}
              </Typography>
              <Typography>Make: {desktop.make}</Typography>
              <Typography>Model: {desktop.model}</Typography>
              <Typography>Serial Number: {desktop.serialNumber}</Typography>
              <Typography>IT Rack: {desktop.itRackNumber}</Typography>
              <Typography>Location: {desktop.location}</Typography>
              <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Images:</Typography>
              <ImagePreview images={desktop.images} />
            </Paper>
          ))}
        </PreviewSection>
      )}

      <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mt: 4 }}>
        Tower End Details
      </Typography>

      {displayTowerEnd?.router && (
        <PreviewSection title="Router Details">
          <Typography>Type: {displayTowerEnd.router.routerType}</Typography>
          <Typography>Serial Number: {displayTowerEnd.router.serialNumber}</Typography>
          <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Router Images:</Typography>
          <ImagePreview images={displayTowerEnd.router.images?.routerImages} />
          <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Cable Connectivity Images:</Typography>
          <ImagePreview images={displayTowerEnd.router.images?.cableConnectivityImages} />
        </PreviewSection>
      )}

      {displayTowerEnd?.radio && (
        <PreviewSection title="Radio Details">
          <Typography>Type: {displayTowerEnd.radio.radioType}</Typography>
          <Typography>Serial Number: {displayTowerEnd.radio.serialNumber}</Typography>
          <Typography>
            LAN Cable Reading: {displayTowerEnd.radio.lanCableReading?.start} - {displayTowerEnd.radio.lanCableReading?.end}
          </Typography>
          <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Images:</Typography>
          <ImagePreview images={displayTowerEnd.radio.images} />
        </PreviewSection>
      )}

        {/* Only show Edit/Submit buttons for regular users, not admins */}
        {(user?.role !== 'admin' && user?.username !== 'admin') && !viewMode && (
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mt: 4,
            flexDirection: { xs: 'column', sm: 'row' },
          }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/ic-submission')}
              sx={{ 
                flex: 1,
                py: 1.5,
                fontSize: '1rem',
              }}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              sx={{ 
                flex: 1,
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
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
            </Button>
          </Box>
        )}
        {/* Show back button for admins */}
        {(user?.role === 'admin' || user?.username === 'admin') && (
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              onClick={() => navigate('/admin')}
              sx={{ 
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                },
              }}
            >
              Back to Admin Dashboard
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default ICPreviewScreen;

