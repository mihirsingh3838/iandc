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
} from '@mui/material';
import { ArrowBack, Home } from '@mui/icons-material';
import { toast } from 'react-toastify';
import TowerEndForm from '../components/ic/TowerEndForm';
import CustomerEndForm from '../components/ic/CustomerEndForm';
import icSubmissionService from '../services/icSubmissionService';
import { useAuth } from '../context/AuthContext';

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

  useEffect(() => {
    if (!facilityId) {
      toast.error('Facility not selected. Please select a facility first.');
      navigate('/facility-selection');
      return;
    }
    loadDraft();
  }, [facilityId]);

  const loadDraft = async () => {
    try {
      setLoading(true);
      const draft = await icSubmissionService.getDraft(facilityId, user?.token);
      if (draft) {
        setFormData({
          tower: draft.towerEnd || {},
          customer: draft.customerEnd || {}
        });
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

  const showError = (message) => {
    toast.error(message);
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      await icSubmissionService.saveDraft(
        facilityId,
        formData.customer,
        formData.tower,
        user?.token
      );
      setShowSaveModal(true);
      toast.success('Draft saved successfully');
    } catch (error) {
      showError(error.response?.data?.message || 'Error saving draft');
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
      await icSubmissionService.submit(
        facilityId,
        formData.customer,
        formData.tower,
        user?.token
      );
      toast.success('Submission successful');
      navigate('/home');
    } catch (error) {
      showError(error.response?.data?.message || 'Error submitting form');
      throw error;
    } finally {
      setLoading(false);
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
          )}
          {activeTab === 1 && (
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
    </Box>
  );
};

export default ICSubmissionScreen;

