import express from 'express';
const { Router } = express;
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { validateCoordinateParams, validateTimestamp } from '../middleware/validation.js';
import { getCurrentWeather, getWeatherDescription } from '../services/weatherService.js';
import { getEnvironmentalFactors } from '../services/environmentalService.js';
import { WeatherRequest, WeatherResponse, Coordinates } from '../types/index.js';

const router = Router();

// GET /api/weather/current
router.get('/current', validateCoordinateParams, asyncHandler(async (req, res) => {
  const coordinates = (req as any).coordinates as Coordinates;
  
  try {
    console.log(`[WEATHER] Getting current weather for ${coordinates.latitude}, ${coordinates.longitude}`);
    
    const weather = await getCurrentWeather(coordinates);
    
    const response: WeatherResponse = {
      success: true,
      data: weather,
      cached: false // Cache status is handled internally by the service
    };
    
    console.log(`[WEATHER] Retrieved: ${getWeatherDescription(weather)}`);
    
    res.json({
      ...response,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[WEATHER ERROR]', error.message);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError('Failed to fetch weather data', 500);
  }
}));

// GET /api/weather/environmental
router.get('/environmental', validateCoordinateParams, validateTimestamp, asyncHandler(async (req, res) => {
  const coordinates = (req as any).coordinates as Coordinates;
  const targetTimestamp = (req as any).timestamp as string | undefined;
  
  try {
    console.log(`[ENVIRONMENTAL] Getting environmental factors for ${coordinates.latitude}, ${coordinates.longitude}${targetTimestamp ? ` at ${targetTimestamp}` : ''}`);
    
    const environmental = await getEnvironmentalFactors(coordinates, targetTimestamp);
    
    console.log(`[ENVIRONMENTAL] Retrieved: ${environmental.season} season, ${environmental.time.hour}:00 local, ${environmental.weather.condition} weather`);
    
    res.json({
      success: true,
      data: environmental,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[ENVIRONMENTAL ERROR]', error.message);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError('Failed to fetch environmental data', 500);
  }
}));

// GET /api/weather/conditions
router.get('/conditions', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      weatherConditions: [
        {
          condition: 'foggy',
          name: 'Foggy',
          description: 'Dense fog creates an otherworldly atmosphere',
          hauntedScore: 90,
          indicators: ['Low visibility', 'Mysterious atmosphere', 'Enhanced spiritual activity']
        },
        {
          condition: 'stormy',
          name: 'Stormy',
          description: 'Electrical storms amplify supernatural phenomena',
          hauntedScore: 80,
          indicators: ['Lightning activity', 'High energy', 'Electromagnetic disturbances']
        },
        {
          condition: 'rainy',
          name: 'Rainy',
          description: 'Rain and moisture enhance spiritual sensitivity',
          hauntedScore: 70,
          indicators: ['Precipitation', 'High humidity', 'Atmospheric pressure changes']
        },
        {
          condition: 'cloudy',
          name: 'Cloudy',
          description: 'Overcast skies provide neutral atmospheric conditions',
          hauntedScore: 40,
          indicators: ['Cloud cover', 'Diffused light', 'Moderate atmospheric activity']
        },
        {
          condition: 'clear',
          name: 'Clear',
          description: 'Clear weather offers minimal supernatural enhancement',
          hauntedScore: 10,
          indicators: ['Clear skies', 'Good visibility', 'Stable atmospheric conditions']
        }
      ],
      modifiers: {
        temperature: {
          frigid: { threshold: '<10°C', bonus: 10, description: 'Frigid temperatures enhance eerie atmosphere' },
          cold: { threshold: '10-20°C', bonus: 5, description: 'Cold air adds to supernatural ambiance' },
          moderate: { threshold: '20-30°C', bonus: 0, description: 'Neutral temperature effect' },
          warm: { threshold: '>30°C', bonus: -5, description: 'Warm weather reduces supernatural activity' }
        },
        visibility: {
          veryLow: { threshold: '<1km', bonus: 15, description: 'Perfect conditions for ghostly encounters' },
          low: { threshold: '1-5km', bonus: 8, description: 'Limited visibility adds mystery' },
          moderate: { threshold: '5-10km', bonus: 0, description: 'Standard visibility conditions' },
          high: { threshold: '>10km', bonus: -3, description: 'Clear visibility reduces mystery' }
        },
        precipitation: {
          active: { bonus: 5, description: 'Active precipitation heightens supernatural atmosphere' },
          none: { bonus: 0, description: 'No precipitation effect' }
        }
      }
    },
    timestamp: new Date().toISOString()
  });
}));

export default router;