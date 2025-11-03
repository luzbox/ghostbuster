const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Ghostbuster Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Mock haunted rating endpoint
app.post('/api/rating/calculate', (req, res) => {
  const { coordinates, locationName } = req.body;
  
  // Mock calculation
  const mockRating = {
    overallScore: Math.floor(Math.random() * 100),
    factors: {
      locationScore: Math.floor(Math.random() * 25),
      weatherScore: Math.floor(Math.random() * 25),
      timeScore: Math.floor(Math.random() * 25),
      seasonScore: Math.floor(Math.random() * 25)
    },
    breakdown: [
      {
        factor: 'Location Type',
        weight: 40,
        contribution: Math.floor(Math.random() * 40),
        description: 'This location has moderate haunted potential'
      },
      {
        factor: 'Weather Conditions',
        weight: 25,
        contribution: Math.floor(Math.random() * 25),
        description: 'Current weather conditions affect supernatural activity'
      }
    ],
    calculatedAt: new Date(),
    location: {
      name: locationName || 'Unknown Location',
      coordinates: coordinates || { latitude: 0, longitude: 0 }
    }
  };
  
  res.json({
    success: true,
    data: mockRating
  });
});

// Mock location search endpoint
app.get('/api/location/search', (req, res) => {
  const { q } = req.query;
  
  const mockResults = [
    { name: `${q} Castle`, type: 'castle', coordinates: { latitude: 40.7128, longitude: -74.0060 } },
    { name: `${q} Cemetery`, type: 'graveyard', coordinates: { latitude: 40.7589, longitude: -73.9851 } },
    { name: `Abandoned ${q} Building`, type: 'abandoned_building', coordinates: { latitude: 40.6782, longitude: -73.9442 } }
  ];
  
  res.json({
    success: true,
    data: mockResults
  });
});

// Mock location analyze endpoint (for map clicks)
app.get('/api/location/analyze', (req, res) => {
  const { lat, lng } = req.query;
  
  const latitude = parseFloat(lat) || 0;
  const longitude = parseFloat(lng) || 0;
  
  // Generate a mock location based on coordinates
  const mockLocation = {
    name: `Location ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    coordinates: { latitude, longitude },
    type: 'regular',
    nearbyPOIs: []
  };
  
  res.json({
    success: true,
    data: mockLocation
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Ghostbuster Backend running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`👻 API endpoints available at /api/*`);
});