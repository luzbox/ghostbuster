import express from 'express';
const { Router } = express;
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { validateCoordinateParams, validateSearchQuery } from '../middleware/validation.js';
import { sanitizeLocationName } from '../utils/validation.js';
import { analyzeLocation, searchLocationByName } from '../services/locationService.js';
import { LocationAnalysisRequest, LocationAnalysisResponse, Coordinates } from '../types/index.js';

const router = Router();

// GET /api/location/analyze
router.get('/analyze', validateCoordinateParams, asyncHandler(async (req, res) => {
  const coordinates = (req as any).coordinates as Coordinates;
  const { name } = req.query;
  const locationName = name ? sanitizeLocationName(name as string) : undefined;
  
  try {
    console.log(`[LOCATION ANALYSIS] Analyzing ${coordinates.latitude}, ${coordinates.longitude}${locationName ? ` (${locationName})` : ''}`);
    
    const location = await analyzeLocation(coordinates, locationName);
    
    const response: LocationAnalysisResponse = {
      success: true,
      data: location,
      cached: false // Cache status is handled internally by the service
    };
    
    console.log(`[LOCATION ANALYSIS] Completed: ${location.type} - ${location.name}`);
    
    res.json({
      ...response,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[LOCATION ANALYSIS ERROR]', error.message);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError('Failed to analyze location', 500);
  }
}));

// GET /api/location/search
router.get('/search', validateSearchQuery, asyncHandler(async (req, res) => {
  const sanitizedQuery = (req as any).searchQuery as string;
  
  try {
    console.log(`[LOCATION SEARCH] Searching for: ${sanitizedQuery}`);
    
    const locations = await searchLocationByName(sanitizedQuery);
    
    console.log(`[LOCATION SEARCH] Found ${locations.length} results for: ${sanitizedQuery}`);
    
    res.json({
      success: true,
      data: locations,
      query: sanitizedQuery,
      count: locations.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[LOCATION SEARCH ERROR]', error.message);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError('Failed to search for locations', 500);
  }
}));

// GET /api/location/types
router.get('/types', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      locationTypes: [
        {
          type: 'castle',
          name: 'Castle',
          description: 'Ancient castles, palaces, and royal residences',
          hauntedScore: 90,
          examples: ['Windsor Castle', 'Edinburgh Castle', 'Neuschwanstein Castle']
        },
        {
          type: 'graveyard',
          name: 'Graveyard/Cemetery',
          description: 'Cemeteries, graveyards, and burial grounds',
          hauntedScore: 85,
          examples: ['Père Lachaise Cemetery', 'Arlington National Cemetery', 'Highgate Cemetery']
        },
        {
          type: 'abandoned_building',
          name: 'Abandoned Building',
          description: 'Derelict structures, ruins, and abandoned facilities',
          hauntedScore: 80,
          examples: ['Abandoned hospitals', 'Derelict factories', 'Ruined churches']
        },
        {
          type: 'fort',
          name: 'Fort/Military Site',
          description: 'Military fortifications, battlegrounds, and defensive structures',
          hauntedScore: 70,
          examples: ['Fort Knox', 'Alcatraz', 'Tower of London']
        },
        {
          type: 'regular',
          name: 'Regular Location',
          description: 'Standard locations with minimal supernatural associations',
          hauntedScore: 10,
          examples: ['Residential areas', 'Shopping centers', 'Parks']
        }
      ]
    },
    timestamp: new Date().toISOString()
  });
}));

export default router;