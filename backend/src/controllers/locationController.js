const axios = require('axios');

// Reverse geocode coordinates to location name using Google Maps API
const reverseGeocode = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Maps API key not configured' });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
    
    const response = await axios.get(url);
    
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      // Get the most relevant result (formatted address)
      const locationName = response.data.results[0].formatted_address;
      res.json({ locationName });
    } else {
      // Fallback to coordinates if geocoding fails
      res.json({ locationName: `${latitude}, ${longitude}` });
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    const { latitude, longitude } = req.query;
    // Fallback to coordinates on error
    res.json({ locationName: `${latitude}, ${longitude}` });
  }
};

module.exports = {
  reverseGeocode
};

