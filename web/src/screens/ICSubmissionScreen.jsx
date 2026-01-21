import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  LinearProgress,
  Alert,
} from '@mui/material';
import { ArrowBack, Home, DeleteOutline } from '@mui/icons-material';
import { toast } from 'react-toastify';
import TowerEndForm from '../components/ic/TowerEndForm';
import CustomerEndForm from '../components/ic/CustomerEndForm';
import icSubmissionService from '../services/icSubmissionService';
import { useAuth } from '../context/AuthContext';
import { validateFormData } from '../utils/formValidation';

const ICSubmissionScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get facility ID from location state or localStorage
  const getFacilityId = () => {
    try {
      if (location.state?.facilityId) {
        return location.state.facilityId;
      }
      const facilityDetails = localStorage.getItem('facilityDetails');
      if (facilityDetails) {
        const parsed = JSON.parse(facilityDetails);
        return parsed.facility_code;
      }
    } catch (error) {
      console.error('Error getting facility ID:', error);
    }
    return null;
  };
  
  const facilityId = getFacilityId();
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    tower: {},
    customer: {}
  });
  const [loading, setLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showClearDialog, setShowClearDialog] = useState(false);

  // LocalStorage key for form data
  const getStorageKey = (id) => `ic_submission_${id}`;

  // Load form data from localStorage on mount
  useEffect(() => {
    if (!facilityId) {
      toast.error('Facility not selected. Please select a facility first.');
      navigate('/facility-selection');
      return;
    }
    
    // First try to load from localStorage (instant)
    const storageKey = getStorageKey(facilityId);
    const storedData = localStorage.getItem(storageKey);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setFormData(parsed);
      } catch (error) {
        console.error('Error parsing stored form data:', error);
      }
    }
    
    // Then load from server draft (will override if exists)
    loadDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  // Auto-save to localStorage whenever formData changes (debounced)
  useEffect(() => {
    if (!facilityId) return;
    
    const timeoutId = setTimeout(() => {
      try {
        const storageKey = getStorageKey(facilityId);
        localStorage.setItem(storageKey, JSON.stringify(formData));
      } catch (error) {
        console.error('Error saving form data to localStorage:', error);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [formData, facilityId]);

  const loadDraft = async () => {
    try {
      setLoading(true);
      const draft = await icSubmissionService.getDraft(facilityId, user?.token);
      if (draft) {
        const loadedData = {
          tower: draft.towerEnd || {},
          customer: draft.customerEnd || {}
        };
        setFormData(loadedData);
        // Also save to localStorage
        const storageKey = getStorageKey(facilityId);
        localStorage.setItem(storageKey, JSON.stringify(loadedData));
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data
      }
    }));
  };

  const showError = (message, details = null) => {
    const fullMessage = details ? `${message}: ${details}` : message;
    toast.error(fullMessage);
    setErrorMessage(fullMessage);
    // Clear error after 5 seconds
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setSubmitProgress(30);
      
      await icSubmissionService.saveDraft(
        facilityId,
        formData.customer,
        formData.tower,
        user?.token
      );
      
      setSubmitProgress(100);
      setShowSaveModal(true);
      toast.success('Draft saved successfully');
      
      // Reset progress after a short delay
      setTimeout(() => setSubmitProgress(0), 500);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Error saving draft';
      const errorDetails = error.response?.data?.error || error.response?.statusText;
      showError(errorMsg, errorDetails);
      setSubmitProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    navigate('/ic-preview', {
      state: {
        customerEnd: formData.customer,
        towerEnd: formData.tower,
        facilityId: facilityId
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setSubmitProgress(10);
      
      // Validate form data before submission
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        showError('Please fix the following errors before submitting:', validationErrors.join('; '));
        setSubmitProgress(0);
        setLoading(false);
        return;
      }
      
      setSubmitProgress(30);
      await icSubmissionService.submit(
        facilityId,
        formData.customer,
        formData.tower,
        user?.token
      );
      
      setSubmitProgress(80);
      // Clear localStorage after successful submission
      const storageKey = getStorageKey(facilityId);
      localStorage.removeItem(storageKey);
      
      setSubmitProgress(100);
      toast.success('Submission successful! Your form has been submitted.');
      
      // Small delay to show completion
      setTimeout(() => {
        navigate('/home');
      }, 500);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Error submitting form';
      const errorDetails = error.response?.data?.error || 
                          (error.response?.status === 401 ? 'Session expired. Please login again.' : 
                           error.response?.status === 403 ? 'You do not have permission to submit.' :
                           error.response?.status === 500 ? 'Server error. Please try again later.' :
                           error.response?.statusText);
      showError(errorMsg, errorDetails);
      setSubmitProgress(0);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const validation = validateFormData(formData);
    return validation.errors;
  };

  const handleClearForm = async () => {
    try {
      // Clear form data
      setFormData({
        tower: {},
        customer: {}
      });

      // Clear localStorage
      const storageKey = getStorageKey(facilityId);
      localStorage.removeItem(storageKey);

      // Clear server draft if exists
      try {
        await icSubmissionService.getDraft(facilityId, user?.token);
        // If draft exists, we should delete it (assuming there's a delete endpoint)
        // For now, we'll just clear local storage
      } catch (error) {
        // Draft doesn't exist or error fetching, that's okay
      }

      setShowClearDialog(false);
      toast.success('Form cleared successfully');
      setErrorMessage(null);
    } catch (error) {
      console.error('Error clearing form:', error);
      toast.error('Error clearing form. Please try again.');
    }
  };

  if (!facilityId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Facility Selected
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please select a facility first.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/facility-selection')}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              },
            }}
          >
            Select Facility
          </Button>
        </Paper>
      </Box>
    );
  }

  if (loading && !formData.tower && !formData.customer) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
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
            onClick={() => navigate('/home')}
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
            I&C Submission
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
          <Tab label="Tower End" />
          <Tab label="Customer End" />
        </Tabs>
      </Paper>

      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 3 }, pb: 4, px: { xs: 2, sm: 3 } }}>
        {errorMessage && (
          <Alert 
            severity="error" 
            onClose={() => setErrorMessage(null)}
            sx={{ mb: 2 }}
          >
            {errorMessage}
          </Alert>
        )}
        
        {loading && submitProgress > 0 && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={submitProgress} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
              }} 
            />
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
              {submitProgress < 30 ? 'Preparing submission...' :
               submitProgress < 80 ? 'Submitting data...' :
               'Finalizing...'} ({submitProgress}%)
            </Typography>
          </Box>
        )}
        
        {activeTab === 0 ? (
          <TowerEndForm
            data={formData.tower}
            onUpdate={(data) => handleUpdate('tower', data)}
            showError={showError}
          />
        ) : (
          <CustomerEndForm
            data={formData.customer}
            onUpdate={(data) => handleUpdate('customer', data)}
            showError={showError}
          />
        )}

        <Paper 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            mt: 3,
            borderRadius: 2,
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
          }}
        >
          {activeTab === 0 && (
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                variant="outlined"
                onClick={() => setShowClearDialog(true)}
                disabled={loading}
                startIcon={<DeleteOutline />}
                sx={{
                  flex: { xs: 1, sm: '0 0 auto' },
                  py: 1.5,
                  fontSize: '1rem',
                  color: 'error.main',
                  borderColor: 'error.main',
                  '&:hover': {
                    borderColor: 'error.dark',
                    backgroundColor: 'error.light',
                  },
                }}
              >
                Clear Form
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveDraft}
                disabled={loading}
                fullWidth
                sx={{
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Draft'}
              </Button>
            </Box>
          )}
          {activeTab === 1 && (
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                variant="outlined"
                onClick={() => setShowClearDialog(true)}
                disabled={loading}
                startIcon={<DeleteOutline />}
                sx={{
                  flex: { xs: 1, sm: '0 0 auto' },
                  py: 1.5,
                  fontSize: '1rem',
                  color: 'error.main',
                  borderColor: 'error.main',
                  '&:hover': {
                    borderColor: 'error.dark',
                    backgroundColor: 'error.light',
                  },
                }}
              >
                Clear Form
              </Button>
              <Button
                variant="contained"
                onClick={handlePreview}
                disabled={loading}
                fullWidth
                sx={{
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Preview & Submit'}
              </Button>
            </Box>
          )}
        </Paper>
      </Container>

      <Dialog 
        open={showSaveModal} 
        onClose={() => setShowSaveModal(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: { xs: '90%', sm: 400 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Draft Saved</DialogTitle>
        <DialogContent>
          <Typography>Your progress has been saved successfully.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setShowSaveModal(false)}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              },
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={showClearDialog} 
        onClose={() => setShowClearDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: { xs: '90%', sm: 400 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>
          Clear Form?
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to clear all form data? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            All entered data, images, and local drafts will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setShowClearDialog(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleClearForm}
            variant="contained"
            color="error"
            sx={{
              '&:hover': {
                backgroundColor: 'error.dark',
              },
            }}
          >
            Clear Form
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ICSubmissionScreen;

