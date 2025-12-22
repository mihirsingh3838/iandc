import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Button,
  Typography,
  Modal,
  TextField,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import facilityData from '../data/facilities.json';

const FacilitySelectionScreen = () => {
  const navigate = useNavigate();
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedFacilityType, setSelectedFacilityType] = useState('');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const districts = [...new Set(facilityData.map(f => f.district))].sort();
  
  const facilityTypes = [...new Set(
    facilityData
      .filter(f => f.district === selectedDistrict)
      .map(f => f.facility_type)
  )].sort();

  const facilities = facilityData
    .filter(f => 
      f.district === selectedDistrict && 
      f.facility_type === selectedFacilityType
    )
    .sort((a, b) => a.facility_name.localeCompare(b.facility_name));

  const getModalTitle = () => {
    switch (modalType) {
      case 'district':
        return 'Select District';
      case 'type':
        return 'Select Facility Type';
      case 'facility':
        return 'Select Facility';
      default:
        return '';
    }
  };

  const handleSubmit = () => {
    if (!selectedDistrict || !selectedFacilityType || !selectedFacility) {
      return;
    }

    const facilityDataObj = {
      district: selectedDistrict,
      facility_type: selectedFacilityType,
      facility_name: selectedFacility.facility_name,
      facility_code: selectedFacility.facility_code,
      Lat: selectedFacility['Lat '] || selectedFacility.Lat || 0,
      longitude: selectedFacility.longitude || 0
    };

    navigate('/facility-summary', { state: { facilityData: facilityDataObj } });
  };

  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
    setSearchQuery('');
  };

  const getFilteredData = () => {
    const query = searchQuery.toLowerCase();
    switch (modalType) {
      case 'district':
        return districts.filter(d => d.toLowerCase().includes(query));
      case 'type':
        return facilityTypes.filter(t => t.toLowerCase().includes(query));
      case 'facility':
        return facilities.filter(f => f.facility_name.toLowerCase().includes(query));
      default:
        return [];
    }
  };

  const handleSelect = (item) => {
    switch (modalType) {
      case 'district':
        setSelectedDistrict(item);
        setSelectedFacilityType('');
        setSelectedFacility(null);
        break;
      case 'type':
        setSelectedFacilityType(item);
        setSelectedFacility(null);
        break;
      case 'facility':
        setSelectedFacility(item);
        break;
    }
    setModalVisible(false);
  };

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
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              fontWeight="bold"
              sx={{ mb: 1 }}
            >
              Select Facility
            </Typography>
            <Typography variant="body1" color="text.secondary">
              State: Jharkhand
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              fullWidth
              variant={selectedDistrict ? "contained" : "outlined"}
              onClick={() => openModal('district')}
              sx={{ 
                py: 2,
                fontSize: '1rem',
                textTransform: 'none',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                },
              }}
            >
              {selectedDistrict || 'Select District'}
            </Button>

            {selectedDistrict && (
              <Button
                fullWidth
                variant={selectedFacilityType ? "contained" : "outlined"}
                onClick={() => openModal('type')}
                sx={{ 
                  py: 2,
                  fontSize: '1rem',
                  textTransform: 'none',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                  },
                }}
              >
                {selectedFacilityType || 'Select Facility Type'}
              </Button>
            )}

            {selectedFacilityType && (
              <Button
                fullWidth
                variant={selectedFacility ? "contained" : "outlined"}
                onClick={() => openModal('facility')}
                sx={{ 
                  py: 2,
                  fontSize: '1rem',
                  textTransform: 'none',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                  },
                }}
              >
                {selectedFacility ? selectedFacility.facility_name : 'Select Facility'}
              </Button>
            )}

            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              disabled={!selectedFacility}
              sx={{ 
                mt: 2, 
                py: 2,
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
              Continue
            </Button>
          </Box>
        </Paper>

        <Modal
          open={modalVisible}
          onClose={() => setModalVisible(false)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 2,
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              maxWidth: { xs: '100%', sm: 500 },
              maxHeight: '90vh',
              bgcolor: 'background.paper',
              borderRadius: 3,
              boxShadow: 24,
              p: { xs: 2, sm: 3 },
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Typography 
              variant="h6" 
              component="h2" 
              gutterBottom 
              align="center" 
              fontWeight="bold"
              sx={{ mb: 2 }}
            >
              {getModalTitle()}
            </Typography>
            <TextField
              fullWidth
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ mb: 2 }}
              variant="outlined"
            />
            <Box sx={{ overflow: 'auto', flex: 1, maxHeight: '60vh' }}>
              <List sx={{ p: 0 }}>
                {getFilteredData().map((item) => (
                  <ListItem
                    key={modalType === 'facility' ? item.facility_code : item}
                    button
                    onClick={() => handleSelect(item)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemText
                      primary={modalType === 'facility' ? item.facility_name : item}
                      primaryTypographyProps={{
                        fontSize: '1rem',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        </Modal>
      </Container>
    </Box>
  );
};

export default FacilitySelectionScreen;

