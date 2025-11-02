import express from 'express';
const { Router } = express;
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { validateJsonBody } from '../middleware/validation.js';
import { validateCoordinates } from '../utils/validation.js';
import { ratingCache, generateRatingKey } from '../utils/cache.js';
import { analyzeLocation } from '../services/locationService.js';
import { getEnvironmentalFactors } from '../services/environmentalService.js';
import { calculateHauntedRating, getRatingExplanation } from '../services/ratingService.js';
import { RatingCalculationRequest, RatingCalculationResponse } from '../types/index.js';

const router = Router();

// POST /api/rating/calculate
router.post('/calculate', validateJsonBody, asyncHandler(async (req, res) => {
  const { coordinates, locationName, timestamp }: RatingCalculationRequest = req.body;
  
  // Validate input
  if (!coordinates) {
    throw createError('Coordinates are required', 400);
  }
  
  if (!validateCoordinates(coordinates)) {
    throw createError('Invalid coordinates provided', 400);
  }
  
  // Generate cache key
  const cacheKey = generateRatingKey(coordinates.latitude, coordinates.longitude, timestamp);
  
  // Check cache first
  const cachedRating = ratingCache.get<RatingCalculationResponse>(cacheKey);
  if (cachedRating) {
    console.log(`[CACHE HIT] Rating calculation for ${cacheKey}`);
    return res.json({
      success: true,
      data: cachedRating.data,
      cached: true,
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    console.log(`[RATING CALC] Starting calculation for ${coordinates.latitude}, ${coordinates.longitude}`);
    
    // Get location analysis and environmental factors in parallel
    const [location, environmental] = await Promise.all([
      analyzeLocation(coordinates, locationName),
      getEnvironmentalFactors(coordinates, timestamp)
    ]);
    
    // Calculate haunted rating
    const rating = calculateHauntedRating(location, environmental);
    
    // Add explanation
    const explanation = getRatingExplanation(rating.overallScore);
    
    const response: RatingCalculationResponse = {
      success: true,
      data: {
        ...rating,
        explanation
      } as any,
      cached: false
    };
    
    // Cache the result
    ratingCache.set(cacheKey, response);
    console.log(`[CACHE SET] Rating calculation cached for ${cacheKey}`);
    
    console.log(`[RATING CALC] Completed: ${rating.overallScore}/100 for ${location.name}`);
    
    res.json({
      ...response,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[RATING CALC ERROR]', error.message);
    
    // If it's already an AppError, re-throw it
    if (error.statusCode) {
      throw error;
    }
    
    // Otherwise, wrap it in a generic error
    throw createError('Failed to calculate haunted rating', 500);
  }
}));

// GET /api/rating/factors - Get available factor information
router.get('/factors', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      weights: {
        location: 0.4,
        weather: 0.25,
        time: 0.25,
        season: 0.1
      },
      locationTypes: {
        castle: { score: 90, description: 'Ancient castles with rich history' },
        graveyard: { score: 85, description: 'Cemeteries and burial grounds' },
        abandoned_building: { score: 80, description: 'Abandoned or derelict structures' },
        fort: { score: 70, description: 'Military fortifications and battlegrounds' },
        regular: { score: 10, description: 'Regular locations with minimal supernatural associations' }
      },
      weatherConditions: {
        foggy: { score: 90, description: 'Dense fog creates otherworldly atmosphere' },
        stormy: { score: 80, description: 'Electrical storms amplify supernatural phenomena' },
        rainy: { score: 70, description: 'Rain enhances spiritual sensitivity' },
        cloudy: { score: 40, description: 'Overcast skies provide neutral backdrop' },
        clear: { score: 10, description: 'Clear weather offers minimal enhancement' }
      },
      timeFactors: {
        witchingHour: { hours: '00:00-03:00', score: 100, description: 'Peak supernatural activity' },
        lateEvening: { hours: '21:00-00:00', score: 80, description: 'High supernatural sensitivity' },
        twilight: { hours: '18:00-21:00', score: 60, description: 'Transition period with moderate activity' },
        earlyMorning: { hours: '03:00-06:00', score: 70, description: 'Residual nighttime energy' },
        daytime: { hours: '06:00-18:00', score: 10, description: 'Suppressed supernatural activity' }
      },
      seasons: {
        autumn: { score: 80, description: 'Peak season for supernatural encounters' },
        winter: { score: 70, description: 'Long nights favor spirit activity' },
        spring: { score: 30, description: 'Renewal diminishes supernatural activity' },
        summer: { score: 20, description: 'Extended daylight suppresses phenomena' }
      }
    },
    timestamp: new Date().toISOString()
  });
}));

export default router;