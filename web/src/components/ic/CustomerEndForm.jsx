import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import { Edit, CameraAlt, Delete } from '@mui/icons-material';
import CameraComponent from '../CameraComponent';

const CustomerEndForm = ({ data, onUpdate, showError }) => {
  const [routerImages, setRouterImages] = useState(data?.router?.images?.routerImages || []);
  const [connectivityImages, setConnectivityImages] = useState(data?.router?.images?.cableConnectivityImages || []);
  const [radioImages, setRadioImages] = useState(data?.radio?.images || []);
  const [showRackModal, setShowRackModal] = useState(false);
  const [currentRack, setCurrentRack] = useState(null);
  const [rackImages, setRackImages] = useState([]);
  
  const [showAPModal, setShowAPModal] = useState(false);
  const [currentAP, setCurrentAP] = useState(null);
  const [apImages, setAPImages] = useState([]);
  
  const [showPOEModal, setShowPOEModal] = useState(false);
  const [currentPOE, setCurrentPOE] = useState(null);
  const [poeImages, setPOEImages] = useState([]);
  
  const [showDesktopModal, setShowDesktopModal] = useState(false);
  const [currentDesktop, setCurrentDesktop] = useState(null);
  const [desktopImages, setDesktopImages] = useState([]);

  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState(null);
  const [cameraMaxImages, setCameraMaxImages] = useState(0);
  const [cameraContext, setCameraContext] = useState(null); // 'main' or modal name

  useEffect(() => {
    setRouterImages(data?.router?.images?.routerImages || []);
    setConnectivityImages(data?.router?.images?.cableConnectivityImages || []);
    setRadioImages(data?.radio?.images || []);
  }, [data]);

  const openCamera = (type, maxImages, context = 'main') => {
    setCameraType(type);
    setCameraMaxImages(maxImages);
    setCameraContext(context);
    setShowCamera(true);
  };

  const handleImageCapture = (base64) => {
    const context = cameraContext;
    
    switch (cameraType) {
      case 'router':
        if (routerImages.length >= cameraMaxImages) {
          showError(`Maximum ${cameraMaxImages} router images allowed`);
          return;
        }
        const newRouterImages = [...routerImages, base64];
        setRouterImages(newRouterImages);
        updateRouterData({
          images: { routerImages: newRouterImages, cableConnectivityImages: connectivityImages }
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
          images: { routerImages, cableConnectivityImages: newConnectivityImages }
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

      case 'rack':
        if (rackImages.length >= cameraMaxImages) {
          showError(`Maximum ${cameraMaxImages} rack images allowed`);
          return;
        }
        setRackImages([...rackImages, base64]);
        break;

      case 'ap':
        if (apImages.length >= cameraMaxImages) {
          showError(`Maximum ${cameraMaxImages} AP images allowed`);
          return;
        }
        setAPImages([...apImages, base64]);
        break;

      case 'poe':
        if (poeImages.length >= cameraMaxImages) {
          showError(`Maximum ${cameraMaxImages} POE switch images allowed`);
          return;
        }
        setPOEImages([...poeImages, base64]);
        break;

      case 'desktop':
        if (desktopImages.length >= cameraMaxImages) {
          showError(`Maximum ${cameraMaxImages} desktop switch images allowed`);
          return;
        }
        setDesktopImages([...desktopImages, base64]);
        break;
    }
    setShowCamera(false);
  };

  const getCurrentImagesForCamera = () => {
    switch (cameraType) {
      case 'router': return routerImages;
      case 'connectivity': return connectivityImages;
      case 'radio': return radioImages;
      case 'rack': return rackImages;
      case 'ap': return apImages;
      case 'poe': return poeImages;
      case 'desktop': return desktopImages;
      default: return [];
    }
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

  const handleAddRack = () => {
    setCurrentRack({
      rackNumber: (data?.itRacks?.length || 0) + 1,
      rackType: '2U',
      floor: 'Ground',
      location: '',
      images: []
    });
    setRackImages([]);
    setShowRackModal(true);
  };

  const handleSaveRack = () => {
    if (!currentRack.location) {
      showError('Please enter rack location');
      return;
    }
    if (rackImages.length < 2) {
      showError('Please add at least 2 rack images');
      return;
    }

    const updatedRack = {
      ...currentRack,
      images: rackImages
    };

    const updatedRacks = [...(data?.itRacks || [])];
    if (currentRack.rackNumber <= updatedRacks.length) {
      updatedRacks[currentRack.rackNumber - 1] = updatedRack;
    } else {
      updatedRacks.push(updatedRack);
    }

    onUpdate({ itRacks: updatedRacks });
    setShowRackModal(false);
  };

  const handleEditRack = (rack) => {
    setCurrentRack(rack);
    setRackImages(rack.images || []);
    setShowRackModal(true);
  };

  const handleAddAP = () => {
    setCurrentAP({
      apNumber: (data?.aps?.length || 0) + 1,
      make: 'Grandstream',
      model: '7604',
      serialNumber: '',
      floor: 'Ground',
      lanCableReading: { start: '', end: '' },
      images: []
    });
    setAPImages([]);
    setShowAPModal(true);
  };

  const handleSaveAP = () => {
    if (!currentAP.serialNumber) {
      showError('Please enter AP serial number');
      return;
    }
    if (apImages.length < 2) {
      showError('Please add at least 2 AP images');
      return;
    }

    const updatedAP = {
      ...currentAP,
      images: apImages
    };

    const updatedAPs = [...(data?.aps || [])];
    if (currentAP.apNumber <= updatedAPs.length) {
      updatedAPs[currentAP.apNumber - 1] = updatedAP;
    } else {
      updatedAPs.push(updatedAP);
    }

    onUpdate({ aps: updatedAPs });
    setShowAPModal(false);
  };

  const handleEditAP = (ap) => {
    setCurrentAP(ap);
    setAPImages(ap.images || []);
    setShowAPModal(true);
  };

  const handleAddPOE = () => {
    setCurrentPOE({
      poeNumber: (data?.poeSwitches?.length || 0) + 1,
      make: 'Grandstream',
      model: '7604',
      serialNumber: '',
      itRackNumber: '',
      location: '',
      images: []
    });
    setPOEImages([]);
    setShowPOEModal(true);
  };

  const handleSavePOE = () => {
    if (!currentPOE.serialNumber) {
      showError('Please enter POE switch serial number');
      return;
    }
    if (!currentPOE.itRackNumber) {
      showError('Please select IT rack number');
      return;
    }
    if (!currentPOE.location) {
      showError('Please enter POE switch location');
      return;
    }
    if (poeImages.length < 2) {
      showError('Please add at least 2 POE switch images');
      return;
    }

    const updatedPOE = {
      ...currentPOE,
      images: poeImages
    };

    const updatedPOEs = [...(data?.poeSwitches || [])];
    if (currentPOE.poeNumber <= updatedPOEs.length) {
      updatedPOEs[currentPOE.poeNumber - 1] = updatedPOE;
    } else {
      updatedPOEs.push(updatedPOE);
    }

    onUpdate({ poeSwitches: updatedPOEs });
    setShowPOEModal(false);
  };

  const handleEditPOE = (poe) => {
    setCurrentPOE(poe);
    setPOEImages(poe.images || []);
    setShowPOEModal(true);
  };

  const handleAddDesktop = () => {
    setCurrentDesktop({
      desktopNumber: (data?.desktopSwitches?.length || 0) + 1,
      make: 'Grandstream',
      model: '7604',
      serialNumber: '',
      itRackNumber: '',
      location: '',
      images: []
    });
    setDesktopImages([]);
    setShowDesktopModal(true);
  };

  const handleSaveDesktop = () => {
    if (!currentDesktop.serialNumber) {
      showError('Please enter desktop switch serial number');
      return;
    }
    if (!currentDesktop.itRackNumber) {
      showError('Please select IT rack number');
      return;
    }
    if (!currentDesktop.location) {
      showError('Please enter desktop switch location');
      return;
    }
    if (desktopImages.length < 2) {
      showError('Please add at least 2 desktop switch images');
      return;
    }

    const updatedDesktop = {
      ...currentDesktop,
      images: desktopImages
    };

    const updatedDesktops = [...(data?.desktopSwitches || [])];
    if (currentDesktop.desktopNumber <= updatedDesktops.length) {
      updatedDesktops[currentDesktop.desktopNumber - 1] = updatedDesktop;
    } else {
      updatedDesktops.push(updatedDesktop);
    }

    onUpdate({ desktopSwitches: updatedDesktops });
    setShowDesktopModal(false);
  };

  const handleEditDesktop = (desktop) => {
    setCurrentDesktop(desktop);
    setDesktopImages(desktop.images || []);
    setShowDesktopModal(true);
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
          onChange={(e, value) => value && updateRouterData({ routerType: value })}
          sx={{ 
            mb: 2,
            flexWrap: 'wrap',
            gap: 1,
            '& .MuiToggleButton-root': {
              flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 auto' },
              minWidth: { xs: 'calc(50% - 8px)', sm: 'auto' },
              textTransform: 'none',
            },
          }}
        >
          <ToggleButton value="HEX">HEX</ToggleButton>
          <ToggleButton value="HEX-S">HEX-S</ToggleButton>
          <ToggleButton value="HAP">HAP</ToggleButton>
          <ToggleButton value="CCR">CCR</ToggleButton>
        </ToggleButtonGroup>

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
                    images: { routerImages: newImages, cableConnectivityImages: connectivityImages }
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
              sx={{ width: 100, height: 100, borderRadius: 1, objectFit: 'cover' }}
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
          onChange={(e, value) => value && updateRadioData({ radioType: value })}
          sx={{ 
            mb: 2,
            flexWrap: 'wrap',
            gap: 1,
            '& .MuiToggleButton-root': {
              flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 auto' },
              minWidth: { xs: 'calc(50% - 8px)', sm: 'auto' },
              textTransform: 'none',
            },
          }}
        >
          <ToggleButton value="LHG5">LHG5</ToggleButton>
          <ToggleButton value="DIISC LITE">DIISC LITE</ToggleButton>
          <ToggleButton value="MIMOSA">MIMOSA</ToggleButton>
        </ToggleButtonGroup>

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

        <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
          Radio Images (2-4 required)
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {radioImages.map((uri, index) => (
            <Box
              key={index}
              component="img"
              src={uri}
              alt={`Radio ${index + 1}`}
              sx={{ width: 100, height: 100, borderRadius: 1, objectFit: 'cover' }}
            />
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

      {/* IT Rack Details */}
      <Paper 
        sx={{ 
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 },
        }}>
          <Typography variant="h6" fontWeight="bold">
            IT Rack Details
          </Typography>
          {(data?.itRacks?.length || 0) < 5 && (
            <Button 
              variant="contained" 
              onClick={handleAddRack}
              sx={{
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              Add Rack
            </Button>
          )}
        </Box>

        {data?.itRacks?.map((rack, index) => (
          <Paper 
            key={index} 
            sx={{ 
              p: { xs: 1.5, sm: 2 }, 
              mb: 1.5, 
              backgroundColor: '#f5f5f5',
              borderRadius: 1.5,
              '&:hover': {
                backgroundColor: '#eeeeee',
              },
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 1,
            }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Rack {rack.rackNumber}
              </Typography>
              <IconButton 
                onClick={() => handleEditRack(rack)}
                size="small"
              >
                <Edit />
              </IconButton>
            </Box>
            <Typography>Type: {rack.rackType}</Typography>
            <Typography>Floor: {rack.floor}</Typography>
            <Typography>Location: {rack.location}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
              {rack.images?.map((uri, imgIndex) => (
                <Box
                  key={imgIndex}
                  component="img"
                  src={uri}
                  alt={`Rack ${rack.rackNumber} Image ${imgIndex + 1}`}
                  sx={{ 
                    width: { xs: 50, sm: 60 },
                    height: { xs: 50, sm: 60 },
                    borderRadius: 1,
                    objectFit: 'cover',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
              ))}
            </Box>
          </Paper>
        ))}
      </Paper>

      {/* AP Details */}
      <Paper 
        sx={{ 
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 },
        }}>
          <Typography variant="h6" fontWeight="bold">
            AP Details
          </Typography>
          {(data?.aps?.length || 0) < 5 && (
            <Button 
              variant="contained" 
              onClick={handleAddAP}
              sx={{
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              Add AP
            </Button>
          )}
        </Box>

        {data?.aps?.map((ap, index) => (
          <Paper key={index} sx={{ p: 2, mb: 1, backgroundColor: '#f5f5f5' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                AP {ap.apNumber}
              </Typography>
              <IconButton onClick={() => handleEditAP(ap)}>
                <Edit />
              </IconButton>
            </Box>
            <Typography>Make: {ap.make}</Typography>
            <Typography>Model: {ap.model}</Typography>
            <Typography>Serial Number: {ap.serialNumber}</Typography>
            <Typography>Floor: {ap.floor}</Typography>
            <Typography>LAN Cable Reading: {ap.lanCableReading?.start} - {ap.lanCableReading?.end}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {ap.images?.map((uri, imgIndex) => (
                <Box
                  key={imgIndex}
                  component="img"
                  src={uri}
                  alt={`AP ${ap.apNumber} Image ${imgIndex + 1}`}
                  sx={{ width: 60, height: 60, borderRadius: 0.5, objectFit: 'cover' }}
                />
              ))}
            </Box>
          </Paper>
        ))}
      </Paper>

      {/* POE Switch Details */}
      <Paper 
        sx={{ 
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 },
        }}>
          <Typography variant="h6" fontWeight="bold">
            POE Switch Details
          </Typography>
          {(data?.poeSwitches?.length || 0) < 5 && (
            <Button 
              variant="contained" 
              onClick={handleAddPOE}
              sx={{
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              Add POE Switch
            </Button>
          )}
        </Box>

        {data?.poeSwitches?.map((poe, index) => (
          <Paper key={index} sx={{ p: 2, mb: 1, backgroundColor: '#f5f5f5' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                POE Switch {poe.poeNumber}
              </Typography>
              <IconButton onClick={() => handleEditPOE(poe)}>
                <Edit />
              </IconButton>
            </Box>
            <Typography>Make: {poe.make}</Typography>
            <Typography>Model: {poe.model}</Typography>
            <Typography>Serial Number: {poe.serialNumber}</Typography>
            <Typography>IT Rack: {poe.itRackNumber}</Typography>
            <Typography>Location: {poe.location}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {poe.images?.map((uri, imgIndex) => (
                <Box
                  key={imgIndex}
                  component="img"
                  src={uri}
                  alt={`POE ${poe.poeNumber} Image ${imgIndex + 1}`}
                  sx={{ width: 60, height: 60, borderRadius: 0.5, objectFit: 'cover' }}
                />
              ))}
            </Box>
          </Paper>
        ))}
      </Paper>

      {/* Desktop Switch Details */}
      <Paper 
        sx={{ 
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 },
        }}>
          <Typography variant="h6" fontWeight="bold">
            Desktop Switch Details
          </Typography>
          {(data?.desktopSwitches?.length || 0) < 5 && (
            <Button 
              variant="contained" 
              onClick={handleAddDesktop}
              sx={{
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              Add Desktop Switch
            </Button>
          )}
        </Box>

        {data?.desktopSwitches?.map((desktop, index) => (
          <Paper key={index} sx={{ p: 2, mb: 1, backgroundColor: '#f5f5f5' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Desktop Switch {desktop.desktopNumber}
              </Typography>
              <IconButton onClick={() => handleEditDesktop(desktop)}>
                <Edit />
              </IconButton>
            </Box>
            <Typography>Make: {desktop.make}</Typography>
            <Typography>Model: {desktop.model}</Typography>
            <Typography>Serial Number: {desktop.serialNumber}</Typography>
            <Typography>IT Rack: {desktop.itRackNumber}</Typography>
            <Typography>Location: {desktop.location}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {desktop.images?.map((uri, imgIndex) => (
                <Box
                  key={imgIndex}
                  component="img"
                  src={uri}
                  alt={`Desktop ${desktop.desktopNumber} Image ${imgIndex + 1}`}
                  sx={{ width: 60, height: 60, borderRadius: 0.5, objectFit: 'cover' }}
                />
              ))}
            </Box>
          </Paper>
        ))}
      </Paper>

      {/* Modals */}
      {/* Rack Modal */}
      <Dialog open={showRackModal} onClose={() => setShowRackModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>IT Rack Details</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1, mt: 1 }}>
            Rack Type
          </Typography>
          <ToggleButtonGroup
            value={currentRack?.rackType || '2U'}
            exclusive
            onChange={(e, value) => value && setCurrentRack(prev => ({ ...prev, rackType: value }))}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="2U">2U</ToggleButton>
            <ToggleButton value="4U">4U</ToggleButton>
          </ToggleButtonGroup>

          <Typography variant="body2" sx={{ mb: 1 }}>
            Floor
          </Typography>
          <ToggleButtonGroup
            value={currentRack?.floor || 'Ground'}
            exclusive
            onChange={(e, value) => value && setCurrentRack(prev => ({ ...prev, floor: value }))}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="Ground">G</ToggleButton>
            <ToggleButton value="1">1</ToggleButton>
            <ToggleButton value="2">2</ToggleButton>
            <ToggleButton value="3">3</ToggleButton>
            <ToggleButton value="4">4</ToggleButton>
          </ToggleButtonGroup>

          <TextField
            fullWidth
            label="Location"
            value={currentRack?.location || ''}
            onChange={(e) => setCurrentRack(prev => ({ ...prev, location: e.target.value }))}
            margin="normal"
          />

          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            Installation Images (2-4 required)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {rackImages.map((uri, index) => (
              <Box key={index} sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={uri}
                  alt={`Rack Image ${index + 1}`}
                  sx={{ width: 100, height: 100, borderRadius: 1, objectFit: 'cover' }}
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    setRackImages(rackImages.filter((_, i) => i !== index));
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
            {rackImages.length < 4 && (
              <Button
                variant="outlined"
                onClick={() => openCamera('rack', 4, 'rack')}
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
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setShowRackModal(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveRack} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* AP Modal */}
      <Dialog 
        open={showAPModal} 
        onClose={() => setShowAPModal(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            m: { xs: 2, sm: 3 },
            maxWidth: { xs: 'calc(100% - 32px)', sm: 500 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>AP Details</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1, mt: 1 }}>
            Make
          </Typography>
          <ToggleButtonGroup
            value={currentAP?.make || 'Grandstream'}
            exclusive
            onChange={(e, value) => value && setCurrentAP(prev => ({ ...prev, make: value }))}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="Grandstream">Grandstream</ToggleButton>
            <ToggleButton value="Other">Other</ToggleButton>
          </ToggleButtonGroup>

          <Typography variant="body2" sx={{ mb: 1 }}>
            Model
          </Typography>
          <ToggleButtonGroup
            value={currentAP?.model || '7604'}
            exclusive
            onChange={(e, value) => value && setCurrentAP(prev => ({ ...prev, model: value }))}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="7604">7604</ToggleButton>
            <ToggleButton value="7603">7603</ToggleButton>
          </ToggleButtonGroup>

          <TextField
            fullWidth
            label="Serial Number"
            value={currentAP?.serialNumber || ''}
            onChange={(e) => setCurrentAP(prev => ({ ...prev, serialNumber: e.target.value }))}
            margin="normal"
          />

          <Typography variant="body2" sx={{ mb: 1, mt: 1 }}>
            Floor
          </Typography>
          <ToggleButtonGroup
            value={currentAP?.floor || 'Ground'}
            exclusive
            onChange={(e, value) => value && setCurrentAP(prev => ({ ...prev, floor: value }))}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="Ground">G</ToggleButton>
            <ToggleButton value="1">1</ToggleButton>
            <ToggleButton value="2">2</ToggleButton>
            <ToggleButton value="3">3</ToggleButton>
            <ToggleButton value="4">4</ToggleButton>
          </ToggleButtonGroup>

          <TextField
            fullWidth
            label="LAN Cable Start Reading"
            type="number"
            value={currentAP?.lanCableReading?.start?.toString() || ''}
            onChange={(e) => setCurrentAP(prev => ({
              ...prev,
              lanCableReading: { ...prev.lanCableReading, start: e.target.value }
            }))}
            margin="normal"
          />

          <TextField
            fullWidth
            label="LAN Cable End Reading"
            type="number"
            value={currentAP?.lanCableReading?.end?.toString() || ''}
            onChange={(e) => setCurrentAP(prev => ({
              ...prev,
              lanCableReading: { ...prev.lanCableReading, end: e.target.value }
            }))}
            margin="normal"
          />

          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            Installation Images (2 required)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {apImages.map((uri, index) => (
              <Box key={index} sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={uri}
                  alt={`AP Image ${index + 1}`}
                  sx={{ width: 100, height: 100, borderRadius: 1, objectFit: 'cover' }}
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    setAPImages(apImages.filter((_, i) => i !== index));
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
            {apImages.length < 2 && (
              <Button
                variant="outlined"
                onClick={() => openCamera('ap', 2, 'ap')}
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
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setShowAPModal(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveAP} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* POE Modal */}
      <Dialog 
        open={showPOEModal} 
        onClose={() => setShowPOEModal(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            m: { xs: 2, sm: 3 },
            maxWidth: { xs: 'calc(100% - 32px)', sm: 500 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>POE Switch Details</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1, mt: 1 }}>
            Make
          </Typography>
          <ToggleButtonGroup
            value={currentPOE?.make || 'Grandstream'}
            exclusive
            onChange={(e, value) => value && setCurrentPOE(prev => ({ ...prev, make: value }))}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="Grandstream">Grandstream</ToggleButton>
            <ToggleButton value="Digisol">Digisol</ToggleButton>
            <ToggleButton value="Dlink">Dlink</ToggleButton>
            <ToggleButton value="Syrotech">Syrotech</ToggleButton>
          </ToggleButtonGroup>

          <Typography variant="body2" sx={{ mb: 1 }}>
            Model
          </Typography>
          <ToggleButtonGroup
            value={currentPOE?.model || '7604'}
            exclusive
            onChange={(e, value) => value && setCurrentPOE(prev => ({ ...prev, model: value }))}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="7604">7604</ToggleButton>
            <ToggleButton value="7603">7603</ToggleButton>
          </ToggleButtonGroup>

          <TextField
            fullWidth
            label="Serial Number"
            value={currentPOE?.serialNumber || ''}
            onChange={(e) => setCurrentPOE(prev => ({ ...prev, serialNumber: e.target.value }))}
            margin="normal"
          />

          <TextField
            fullWidth
            label="IT Rack Number"
            type="number"
            value={currentPOE?.itRackNumber || ''}
            onChange={(e) => setCurrentPOE(prev => ({ ...prev, itRackNumber: e.target.value }))}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Location"
            value={currentPOE?.location || ''}
            onChange={(e) => setCurrentPOE(prev => ({ ...prev, location: e.target.value }))}
            margin="normal"
          />

          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            Installation Images (2 required)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {poeImages.map((uri, index) => (
              <Box key={index} sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={uri}
                  alt={`POE Image ${index + 1}`}
                  sx={{ width: 100, height: 100, borderRadius: 1, objectFit: 'cover' }}
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    setPOEImages(poeImages.filter((_, i) => i !== index));
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
            {poeImages.length < 2 && (
              <Button
                variant="outlined"
                onClick={() => openCamera('poe', 2, 'poe')}
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
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setShowPOEModal(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSavePOE} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Desktop Modal */}
      <Dialog 
        open={showDesktopModal} 
        onClose={() => setShowDesktopModal(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            m: { xs: 2, sm: 3 },
            maxWidth: { xs: 'calc(100% - 32px)', sm: 500 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Desktop Switch Details</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1, mt: 1 }}>
            Make
          </Typography>
          <ToggleButtonGroup
            value={currentDesktop?.make || 'Grandstream'}
            exclusive
            onChange={(e, value) => value && setCurrentDesktop(prev => ({ ...prev, make: value }))}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="Grandstream">Grandstream</ToggleButton>
            <ToggleButton value="Digisol">Digisol</ToggleButton>
            <ToggleButton value="Dlink">Dlink</ToggleButton>
            <ToggleButton value="Syrotech">Syrotech</ToggleButton>
          </ToggleButtonGroup>

          <Typography variant="body2" sx={{ mb: 1 }}>
            Model
          </Typography>
          <ToggleButtonGroup
            value={currentDesktop?.model || '7604'}
            exclusive
            onChange={(e, value) => value && setCurrentDesktop(prev => ({ ...prev, model: value }))}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="7604">7604</ToggleButton>
            <ToggleButton value="7603">7603</ToggleButton>
          </ToggleButtonGroup>

          <TextField
            fullWidth
            label="Serial Number"
            value={currentDesktop?.serialNumber || ''}
            onChange={(e) => setCurrentDesktop(prev => ({ ...prev, serialNumber: e.target.value }))}
            margin="normal"
          />

          <TextField
            fullWidth
            label="IT Rack Number"
            type="number"
            value={currentDesktop?.itRackNumber || ''}
            onChange={(e) => setCurrentDesktop(prev => ({ ...prev, itRackNumber: e.target.value }))}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Location"
            value={currentDesktop?.location || ''}
            onChange={(e) => setCurrentDesktop(prev => ({ ...prev, location: e.target.value }))}
            margin="normal"
          />

          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            Installation Images (2 required)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {desktopImages.map((uri, index) => (
              <Box key={index} sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={uri}
                  alt={`Desktop Image ${index + 1}`}
                  sx={{ width: 100, height: 100, borderRadius: 1, objectFit: 'cover' }}
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    setDesktopImages(desktopImages.filter((_, i) => i !== index));
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
            {desktopImages.length < 2 && (
              <Button
                variant="outlined"
                onClick={() => openCamera('desktop', 2, 'desktop')}
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
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setShowDesktopModal(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveDesktop} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <CameraComponent
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleImageCapture}
        maxImages={cameraMaxImages}
        currentImages={getCurrentImagesForCamera()}
      />
    </Box>
  );
};

export default CustomerEndForm;

