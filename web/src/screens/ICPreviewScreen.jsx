import React, { useState, useEffect, useMemo } from 'react';
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
  Dialog,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { ArrowBack, Home, Close, ZoomIn, PictureAsPdf } from '@mui/icons-material';
import { toast } from 'react-toastify';
import icSubmissionService from '../services/icSubmissionService';
import apiClient from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import facilitiesData from '../data/facilities.json';
import { generatePDFReport } from '../utils/pdfGenerator';

const ImagePreview = ({ images, size = 'small', onImageClick, isAdmin = false }) => {
  const handleClick = (image) => {
    if (isAdmin && onImageClick) {
      onImageClick(image);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}>
      {images?.map((image, index) => {
        const imageUrl = typeof image === 'string' ? image : image.url || image;
        return (
          <Box
            key={index}
            component="img"
            src={imageUrl}
            alt={`Preview ${index + 1}`}
            onClick={() => handleClick(imageUrl)}
            sx={{
              width: size === 'small' ? { xs: 50, sm: 60 } : { xs: 80, sm: 100 },
              height: size === 'small' ? { xs: 50, sm: 60 } : { xs: 80, sm: 100 },
              borderRadius: 1.5,
              objectFit: 'cover',
              border: '2px solid',
              borderColor: 'divider',
              cursor: isAdmin ? 'pointer' : 'default',
              transition: 'transform 0.2s',
              '&:hover': isAdmin ? {
                transform: 'scale(1.05)',
                boxShadow: 3,
              } : {},
            }}
          />
        );
      })}
    </Box>
  );
};

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
  const [imageDialog, setImageDialog] = useState({ open: false, imageUrl: null });
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  const isAdmin = user?.role === 'admin' || user?.username === 'admin';

  // Create facility mapping
  const facilityMap = useMemo(() => {
    const map = {};
    facilitiesData.forEach(facility => {
      map[facility.facility_code] = facility.facility_name;
    });
    return map;
  }, []);

  const getFacilityName = (facilityId) => {
    return facilityMap[facilityId] || facilityId;
  };

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
      console.log('Fetched submission data:', response.data);
      console.log('Customer end siteVideo:', response.data?.customerEnd?.siteVideo);
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
      // Clear localStorage after successful submission
      const storageKey = `ic_submission_${submissionData.facilityId || facilityId}`;
      localStorage.removeItem(storageKey);
      toast.success('Submission successful');
      navigate('/home');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Error submitting form');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!submissionData) {
      toast.error('No submission data available');
      return;
    }

    try {
      setGeneratingPDF(true);
      const facilityName = getFacilityName(submissionData.facilityId || facilityId);
      const submitterName = submissionData.userId?.name || submissionData.userId?.username || 'Unknown';
      
      await generatePDFReport(submissionData, facilityName, submitterName);
      toast.success('PDF report generated successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Error generating PDF report');
    } finally {
      setGeneratingPDF(false);
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
        {/* Show site name and submitter name for admins */}
        {isAdmin && submissionData && (
          <Paper 
            sx={{ 
              p: { xs: 2, sm: 3 },
              mb: 3,
              mt: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <Typography 
              variant="h5" 
              gutterBottom 
              fontWeight="bold"
              sx={{ mb: 2 }}
            >
              Site: {getFacilityName(submissionData.facilityId || facilityId)}
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ mb: 2 }}
            >
              Submitted By: {submissionData.userId?.name || submissionData.userId?.username || 'Unknown'}
            </Typography>
            {submissionData.submittedAt && (
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Submission Date: {new Date(submissionData.submittedAt).toLocaleString()}
              </Typography>
            )}
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={generatingPDF ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdf />}
                onClick={handleGeneratePDF}
                disabled={generatingPDF}
                sx={{
                  backgroundColor: 'white',
                  color: '#667eea',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  },
                }}
              >
                {generatingPDF ? 'Generating PDF...' : 'Download PDF Report'}
              </Button>
            </Box>
          </Paper>
        )}

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
          {displayCustomerEnd.router.routerModel && (
            <Typography>Model: {displayCustomerEnd.router.routerModel}</Typography>
          )}
          <Typography>Serial Number: {displayCustomerEnd.router.serialNumber}</Typography>
          <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Router Images:</Typography>
          <ImagePreview 
            images={displayCustomerEnd.router.images?.routerImages} 
            isAdmin={isAdmin}
            onImageClick={(url) => setImageDialog({ open: true, imageUrl: url })}
          />
          <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Cable Connectivity Images:</Typography>
          <ImagePreview 
            images={displayCustomerEnd.router.images?.cableConnectivityImages}
            isAdmin={isAdmin}
            onImageClick={(url) => setImageDialog({ open: true, imageUrl: url })}
          />
        </PreviewSection>
      )}

      {displayCustomerEnd?.radio && (
        <PreviewSection title="Radio Details">
          <Typography>Type: {displayCustomerEnd.radio.radioType}</Typography>
          {displayCustomerEnd.radio.radioModel && (
            <Typography>Model: {displayCustomerEnd.radio.radioModel}</Typography>
          )}
          <Typography>Serial Number: {displayCustomerEnd.radio.serialNumber}</Typography>
          <Typography>
            LAN Cable Reading: {displayCustomerEnd.radio.lanCableReading?.start} - {displayCustomerEnd.radio.lanCableReading?.end}
          </Typography>
          <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Images:</Typography>
          <ImagePreview 
            images={displayCustomerEnd.radio.images}
            isAdmin={isAdmin}
            onImageClick={(url) => setImageDialog({ open: true, imageUrl: url })}
          />
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
              <ImagePreview 
                images={rack.images}
                isAdmin={isAdmin}
                onImageClick={(url) => setImageDialog({ open: true, imageUrl: url })}
              />
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
              <ImagePreview 
                images={ap.images}
                isAdmin={isAdmin}
                onImageClick={(url) => setImageDialog({ open: true, imageUrl: url })}
              />
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
              <ImagePreview 
                images={poe.images}
                isAdmin={isAdmin}
                onImageClick={(url) => setImageDialog({ open: true, imageUrl: url })}
              />
            </Paper>
          ))}
        </PreviewSection>
      )}

      {displayCustomerEnd?.siteVideo && (
        <PreviewSection title="Site Video">
          <Box
            component="video"
            src={displayCustomerEnd.siteVideo}
            controls
            preload="metadata"
            sx={{
              width: '100%',
              maxWidth: 800,
              borderRadius: 2,
              border: '2px solid',
              borderColor: 'divider',
              backgroundColor: '#000',
            }}
          >
            Your browser does not support the video tag.
          </Box>
        </PreviewSection>
      )}

      <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mt: 4 }}>
        Tower End Details
      </Typography>

      {displayTowerEnd?.router && (
        <PreviewSection title="Router Details">
          <Typography>Type: {displayTowerEnd.router.routerType}</Typography>
          {displayTowerEnd.router.routerModel && (
            <Typography>Model: {displayTowerEnd.router.routerModel}</Typography>
          )}
          <Typography>Serial Number: {displayTowerEnd.router.serialNumber}</Typography>
          <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Router Images:</Typography>
          <ImagePreview 
            images={displayTowerEnd.router.images?.routerImages}
            isAdmin={isAdmin}
            onImageClick={(url) => setImageDialog({ open: true, imageUrl: url })}
          />
          <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Cable Connectivity Images:</Typography>
          <ImagePreview 
            images={displayTowerEnd.router.images?.cableConnectivityImages}
            isAdmin={isAdmin}
            onImageClick={(url) => setImageDialog({ open: true, imageUrl: url })}
          />
        </PreviewSection>
      )}

      {displayTowerEnd?.radio && (
        <PreviewSection title="Radio Details">
          <Typography>Type: {displayTowerEnd.radio.radioType}</Typography>
          {displayTowerEnd.radio.radioModel && (
            <Typography>Model: {displayTowerEnd.radio.radioModel}</Typography>
          )}
          <Typography>Serial Number: {displayTowerEnd.radio.serialNumber}</Typography>
          <Typography>
            LAN Cable Reading: {displayTowerEnd.radio.lanCableReading?.start} - {displayTowerEnd.radio.lanCableReading?.end}
          </Typography>
          <Typography sx={{ mt: 1, fontWeight: 'bold' }}>Images:</Typography>
          <ImagePreview 
            images={displayTowerEnd.radio.images}
            isAdmin={isAdmin}
            onImageClick={(url) => setImageDialog({ open: true, imageUrl: url })}
          />
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

      {/* Full-screen image dialog for admin */}
      <Dialog
        open={imageDialog.open}
        onClose={() => setImageDialog({ open: false, imageUrl: null })}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            boxShadow: 'none',
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
          <IconButton
            onClick={() => setImageDialog({ open: false, imageUrl: null })}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            <Close />
          </IconButton>
          {imageDialog.imageUrl && (
            <Box
              component="img"
              src={imageDialog.imageUrl}
              alt="Full view"
              sx={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', p: 1 }}>
          <Button
            onClick={() => setImageDialog({ open: false, imageUrl: null })}
            sx={{ color: 'white' }}
            startIcon={<Close />}
          >
            Close
          </Button>
          {imageDialog.imageUrl && (
            <Button
              onClick={() => window.open(imageDialog.imageUrl, '_blank')}
              sx={{ color: 'white' }}
              startIcon={<ZoomIn />}
            >
              Open in New Tab
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ICPreviewScreen;

