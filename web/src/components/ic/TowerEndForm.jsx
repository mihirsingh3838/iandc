import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  IconButton,
} from '@mui/material';
import { CameraAlt, Delete } from '@mui/icons-material';
import CameraComponent from '../CameraComponent';

const TowerEndForm = ({ data, onUpdate, showError }) => {
  const [routerImages, setRouterImages] = useState([]);
  const [connectivityImages, setConnectivityImages] = useState([]);
  const [radioImages, setRadioImages] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState(null);
  const [cameraMaxImages, setCameraMaxImages] = useState(0);

  useEffect(() => {
    setRouterImages(data?.router?.images?.routerImages || []);
    setConnectivityImages(data?.router?.images?.cableConnectivityImages || []);
    setRadioImages(data?.radio?.images || []);
  }, [data]);

  const openCamera = (type, maxImages) => {
    setCameraType(type);
    setCameraMaxImages(maxImages);
    setShowCamera(true);
  };

  const handleImageCapture = (base64) => {
    switch (cameraType) {
      case 'router':
        if (routerImages.length >= cameraMaxImages) {
          showError(`Maximum ${cameraMaxImages} router images allowed`);
          return;
        }
        const newRouterImages = [...routerImages, base64];
        setRouterImages(newRouterImages);
        updateRouterData({
          images: {
            ...data?.router?.images,
            routerImages: newRouterImages
          }
        });
        break;

      case 'connectivity':
        if (connectivityImages.length >= cameraMaxImages) {
          showError(`Maximum ${cameraMaxImages} connectivity images allowed`);
          return;
        }
        const newConnectivityImages = [...connectivityImages, base64];
        setConnectivityImages(newConnectivityImages);
        updateRouterData({
          images: {
            ...data?.router?.images,
            cableConnectivityImages: newConnectivityImages
          }
        });
        break;

      case 'radio':
        if (radioImages.length >= cameraMaxImages) {
          showError(`Maximum ${cameraMaxImages} radio images allowed`);
          return;
        }
        const newRadioImages = [...radioImages, base64];
        setRadioImages(newRadioImages);
        updateRadioData({ images: newRadioImages });
        break;
    }
    setShowCamera(false);
  };

  const updateRouterData = (newData) => {
    const routerData = {
      ...data?.router,
      ...newData
    };
    onUpdate({ router: routerData });
  };

  const updateRadioData = (newData) => {
    const radioData = {
      ...data?.radio,
      ...newData
    };
    onUpdate({ radio: radioData });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
      {/* Router Details */}
      <Paper 
        sx={{ 
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
          Router Details
        </Typography>

        <Typography variant="body2" sx={{ mb: 1.5, mt: 2, fontWeight: 500 }}>
          Router Type
        </Typography>
        <ToggleButtonGroup
          value={data?.router?.routerType || ''}
          exclusive
          onChange={(e, value) => value && updateRouterData({ routerType: value, routerModel: '' })}
          sx={{ 
            mb: 2,
            flexWrap: 'wrap',
            gap: 1,
            '& .MuiToggleButton-root': {
              flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 auto' },
              minWidth: { xs: 'calc(50% - 8px)', sm: 'auto' },
              textTransform: 'none',
              '&.Mui-selected': {
                backgroundColor: '#667eea',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#5568d3',
                },
              },
            },
          }}
        >
          <ToggleButton value="Mikrotik">Mikrotik</ToggleButton>
          <ToggleButton value="CCR">CCR</ToggleButton>
        </ToggleButtonGroup>

        {data?.router?.routerType === 'Mikrotik' && (
          <>
            <Typography variant="body2" sx={{ mb: 1.5, mt: 2, fontWeight: 500 }}>
              Mikrotik Model
            </Typography>
            <ToggleButtonGroup
              value={data?.router?.routerModel || ''}
              exclusive
              onChange={(e, value) => value && updateRouterData({ routerModel: value })}
              sx={{ 
                mb: 2,
                flexWrap: 'wrap',
                gap: 1,
                '& .MuiToggleButton-root': {
                  flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 auto' },
                  minWidth: { xs: 'calc(50% - 8px)', sm: 'auto' },
                  textTransform: 'none',
                  '&.Mui-selected': {
                    backgroundColor: '#667eea',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#5568d3',
                    },
                  },
                },
              }}
            >
              <ToggleButton value="L009">L009</ToggleButton>
              <ToggleButton value="hexS 760iGS">hexS 760iGS</ToggleButton>
              <ToggleButton value="hex 750Gr3">hex 750Gr3</ToggleButton>
            </ToggleButtonGroup>
          </>
        )}

        {data?.router?.routerType === 'CCR' && (
          <>
            <Typography variant="body2" sx={{ mb: 1.5, mt: 2, fontWeight: 500 }}>
              CCR Model
            </Typography>
            <ToggleButtonGroup
              value={data?.router?.routerModel || ''}
              exclusive
              onChange={(e, value) => value && updateRouterData({ routerModel: value })}
              sx={{ 
                mb: 2,
                flexWrap: 'wrap',
                gap: 1,
                '& .MuiToggleButton-root': {
                  flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 auto' },
                  minWidth: { xs: 'calc(50% - 8px)', sm: 'auto' },
                  textTransform: 'none',
                  '&.Mui-selected': {
                    backgroundColor: '#667eea',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#5568d3',
                    },
                  },
                },
              }}
            >
              <ToggleButton value="2004-1G-12S+2XS">2004-1G-12S+2XS</ToggleButton>
              <ToggleButton value="2004-16G-2S+">2004-16G-2S+</ToggleButton>
              <ToggleButton value="2116-12G-4S+">2116-12G-4S+</ToggleButton>
            </ToggleButtonGroup>
          </>
        )}

        <TextField
          fullWidth
          label="Serial Number"
          value={data?.router?.serialNumber || ''}
          onChange={(e) => updateRouterData({ serialNumber: e.target.value })}
          margin="normal"
        />

        <Typography variant="body2" sx={{ mt: 3, mb: 1.5, fontWeight: 500 }}>
          Router Images (2 required)
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
          {routerImages.map((uri, index) => (
            <Box
              key={index}
              sx={{ position: 'relative' }}
            >
              <Box
                component="img"
                src={uri}
                alt={`Router ${index + 1}`}
                sx={{
                  width: { xs: 80, sm: 100 },
                  height: { xs: 80, sm: 100 },
                  borderRadius: 1.5,
                  objectFit: 'cover',
                  border: '2px solid',
                  borderColor: 'divider',
                }}
              />
              <IconButton
                size="small"
                onClick={() => {
                  const newImages = routerImages.filter((_, i) => i !== index);
                  setRouterImages(newImages);
                  updateRouterData({
                    images: {
                      ...data?.router?.images,
                      routerImages: newImages
                    }
                  });
                }}
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: 'error.main',
                  color: 'white',
                  width: 24,
                  height: 24,
                  '&:hover': {
                    backgroundColor: 'error.dark',
                  },
                }}
              >
                <Delete sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ))}
          {routerImages.length < 2 && (
            <Button
              variant="outlined"
              onClick={() => openCamera('router', 2)}
              startIcon={<CameraAlt />}
              sx={{ 
                width: { xs: 80, sm: 100 },
                height: { xs: 80, sm: 100 },
                minWidth: { xs: 80, sm: 100 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              Capture
            </Button>
          )}
        </Box>

        <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
          Cable Connectivity Images (2 required)
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {connectivityImages.map((uri, index) => (
            <Box
              key={index}
              component="img"
              src={uri}
              alt={`Connectivity ${index + 1}`}
              sx={{
                width: 100,
                height: 100,
                borderRadius: 1,
                objectFit: 'cover',
              }}
            />
          ))}
          {connectivityImages.length < 2 && (
            <Button
              variant="outlined"
              onClick={() => openCamera('connectivity', 2)}
              startIcon={<CameraAlt />}
              sx={{ 
                width: { xs: 80, sm: 100 },
                height: { xs: 80, sm: 100 },
                minWidth: { xs: 80, sm: 100 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              Capture
            </Button>
          )}
        </Box>
      </Paper>

      {/* Radio Details */}
      <Paper 
        sx={{ 
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
          Radio Details
        </Typography>

        <Typography variant="body2" sx={{ mb: 1.5, mt: 2, fontWeight: 500 }}>
          Radio Type
        </Typography>
        <ToggleButtonGroup
          value={data?.radio?.radioType || ''}
          exclusive
          onChange={(e, value) => value && updateRadioData({ radioType: value, radioModel: '' })}
          sx={{ 
            mb: 2,
            flexWrap: 'wrap',
            gap: 1,
            '& .MuiToggleButton-root': {
              flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 auto' },
              minWidth: { xs: 'calc(50% - 8px)', sm: 'auto' },
              textTransform: 'none',
              '&.Mui-selected': {
                backgroundColor: '#667eea',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#5568d3',
                },
              },
            },
          }}
        >
          <ToggleButton value="LHG5">LHG5</ToggleButton>
          <ToggleButton value="DIISC LITE">DIISC LITE</ToggleButton>
          <ToggleButton value="Mimosa">Mimosa</ToggleButton>
        </ToggleButtonGroup>

        {data?.radio?.radioType === 'Mimosa' && (
          <>
            <Typography variant="body2" sx={{ mb: 1.5, mt: 2, fontWeight: 500 }}>
              Mimosa Model
            </Typography>
            <ToggleButtonGroup
              value={data?.radio?.radioModel || ''}
              exclusive
              onChange={(e, value) => value && updateRadioData({ radioModel: value })}
              sx={{ 
                mb: 2,
                flexWrap: 'wrap',
                gap: 1,
                '& .MuiToggleButton-root': {
                  flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 auto' },
                  minWidth: { xs: 'calc(50% - 8px)', sm: 'auto' },
                  textTransform: 'none',
                  '&.Mui-selected': {
                    backgroundColor: '#667eea',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#5568d3',
                    },
                  },
                },
              }}
            >
              <ToggleButton value="C6X">C6X</ToggleButton>
              <ToggleButton value="C5X with Mimosa Antenna">C5X with Mimosa Antenna</ToggleButton>
              <ToggleButton value="C5X with Fibergate Antenna">C5X with Fibergate Antenna</ToggleButton>
              <ToggleButton value="B6X with Mimosa Antenna">B6X with Mimosa Antenna</ToggleButton>
              <ToggleButton value="Ethernet surge protector">Ethernet surge protector</ToggleButton>
            </ToggleButtonGroup>
          </>
        )}

        <TextField
          fullWidth
          label="Serial Number"
          value={data?.radio?.serialNumber || ''}
          onChange={(e) => updateRadioData({ serialNumber: e.target.value })}
          margin="normal"
        />

        <TextField
          fullWidth
          label="LAN Cable Start Reading"
          type="number"
          value={data?.radio?.lanCableReading?.start?.toString() || ''}
          onChange={(e) => updateRadioData({
            lanCableReading: {
              ...data?.radio?.lanCableReading,
              start: parseFloat(e.target.value) || 0
            }
          })}
          margin="normal"
        />

        <TextField
          fullWidth
          label="LAN Cable End Reading"
          type="number"
          value={data?.radio?.lanCableReading?.end?.toString() || ''}
          onChange={(e) => updateRadioData({
            lanCableReading: {
              ...data?.radio?.lanCableReading,
              end: parseFloat(e.target.value) || 0
            }
          })}
          margin="normal"
        />

        <Typography variant="body2" sx={{ mt: 3, mb: 1.5, fontWeight: 500 }}>
          Radio Images (2-4 required)
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {radioImages.map((uri, index) => (
            <Box
              key={index}
              sx={{ position: 'relative' }}
            >
              <Box
                component="img"
                src={uri}
                alt={`Radio ${index + 1}`}
                sx={{
                  width: { xs: 80, sm: 100 },
                  height: { xs: 80, sm: 100 },
                  borderRadius: 1.5,
                  objectFit: 'cover',
                  border: '2px solid',
                  borderColor: 'divider',
                }}
              />
              <IconButton
                size="small"
                onClick={() => {
                  const newImages = radioImages.filter((_, i) => i !== index);
                  setRadioImages(newImages);
                  updateRadioData({ images: newImages });
                }}
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: 'error.main',
                  color: 'white',
                  width: 24,
                  height: 24,
                  '&:hover': {
                    backgroundColor: 'error.dark',
                  },
                }}
              >
                <Delete sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ))}
          {radioImages.length < 4 && (
            <Button
              variant="outlined"
              onClick={() => openCamera('radio', 4)}
              startIcon={<CameraAlt />}
              sx={{ 
                width: { xs: 80, sm: 100 },
                height: { xs: 80, sm: 100 },
                minWidth: { xs: 80, sm: 100 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              Capture
            </Button>
          )}
        </Box>
      </Paper>

      <CameraComponent
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleImageCapture}
        maxImages={cameraMaxImages}
        currentImages={
          cameraType === 'router' ? routerImages :
          cameraType === 'connectivity' ? connectivityImages :
          radioImages
        }
      />
    </Box>
  );
};

export default TowerEndForm;

