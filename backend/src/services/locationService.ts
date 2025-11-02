import axios from 'axios';
import { config } from '../config/index.js';
import { locationCache, generateLocationKey } from '../utils/cache.js';
import { createError } from '../middleware/errorHandler.js';
import { 
  Location, 
  LocationType, 
  Coordinates, 
  PointOfInterest,
  GooglePlacesResponse,
  MapboxGeocodingResponse 
} from '../types/index.js';

/**
 * Analyze a location to determine its type and nearby points of interest
 */
export async function analyzeLocation(coordinates: Coordinates, locationName?: string): Promise<Location> {
  const cacheKey = generateLocationKey(coordinates.latitude, coordinates.longitude);
  
  // Check cache first
  const cachedLocation = locationCache.get<Location>(cacheKey);
  if (cachedLocation) {
    console.log(`[CACHE HIT] Location data for ${cacheKey}`);
    return cachedLocation;
  }
  
  try {
    // Get location details from multiple sources
    const [placesData, geocodingData] = await Promise.allSettled([
      getNearbyPlaces(coordinates),
      getLocationFromGeocoding(coordinates, locationName)
    ]);
    
    // Determine location type based on nearby places and geocoding data
    const nearbyPOIs = placesData.status === 'fulfilled' ? placesData.value : [];
    const geocodingInfo = geocodingData.status === 'fulfilled' ? geocodingData.value : null;
    
    const locationType = determineLocationType(nearbyPOIs, geocodingInfo);
    const locationName_final = geocodingInfo?.name || locationName || `Location at ${coordinates.latitude}, ${coordinates.longitude}`;
    const address = geocodingInfo?.address || `${coordinates.latitude}, ${coordinates.longitude}`;
    
    const location: Location = {
      coordinates,
      name: locationName_final,
      type: locationType,
      nearbyPOIs,
      address
    };
    
    // Cache the result
    locationCache.set(cacheKey, location);
    console.log(`[CACHE SET] Location data cached for ${cacheKey}`);
    
    return location;
    
  } catch (error: any) {
    console.error('[LOCATION SERVICE ERROR]', error.message);
    
    // Return a basic location if all services fail
    return {
      coordinates,
      name: locationName || `Location at ${coordinates.latitude}, ${coordinates.longitude}`,
      type: LocationType.REGULAR,
      nearbyPOIs: [],
      address: `${coordinates.latitude}, ${coordinates.longitude}`
    };
  }
}

/**
 * Get nearby places using Google Places API
 */
async function getNearbyPlaces(coordinates: Coordinates): Promise<PointOfInterest[]> {
  if (!config.googlePlacesApiKey) {
    console.warn('[PLACES API] API key not configured, skipping places lookup');
    return [];
  }
  
  try {
    const url = `${config.googlePlacesBaseUrl}/nearbysearch/json`;
    const params = {
      location: `${coordinates.latitude},${coordinates.longitude}`,
      radius: 1000, // 1km radius
      key: config.googlePlacesApiKey,
      type: 'point_of_interest'
    };
    
    console.log(`[API CALL] Fetching nearby places for ${coordinates.latitude}, ${coordinates.longitude}`);
    const response = await axios.get<GooglePlacesResponse>(url, { 
      params,
      timeout: 5000 
    });
    
    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Places API error: ${response.data.status}`);
    }
    
    return response.data.results.map(place => ({
      name: place.name,
      type: place.types[0] || 'unknown',
      distance: calculateDistance(
        coordinates,
        { latitude: place.geometry.location.lat, longitude: place.geometry.location.lng }
      )
    })).slice(0, 10); // Limit to 10 POIs
    
  } catch (error: any) {
    console.error('[PLACES API ERROR]', error.message);
    return [];
  }
}

/**
 * Get location information from Mapbox Geocoding API
 */
async function getLocationFromGeocoding(coordinates: Coordinates, locationName?: string): Promise<{ name: string; address: string } | null> {
  if (!config.mapboxAccessToken) {
    console.warn('[GEOCODING API] Access token not configured, skipping geocoding lookup');
    return null;
  }
  
  try {
    const url = `${config.mapboxGeocodingBaseUrl}/${coordinates.longitude},${coordinates.latitude}.json`;
    const params = {
      access_token: config.mapboxAccessToken,
      types: 'poi,address,place'
    };
    
    console.log(`[API CALL] Reverse geocoding for ${coordinates.latitude}, ${coordinates.longitude}`);
    const response = await axios.get<MapboxGeocodingResponse>(url, { 
      params,
      timeout: 5000 
    });
    
    if (response.data.features.length === 0) {
      return null;
    }
    
    const feature = response.data.features[0];
    return {
      name: feature.text || locationName || 'Unknown Location',
      address: feature.place_name
    };
    
  } catch (error: any) {
    console.error('[GEOCODING API ERROR]', error.message);
    return null;
  }
}

/**
 * Determine location type based on nearby POIs and geocoding data
 */
function determineLocationType(nearbyPOIs: PointOfInterest[], geocodingInfo: { name: string; address: string } | null): LocationType {
  // Check for specific location types in POIs
  const poiTypes = nearbyPOIs.map(poi => poi.type.toLowerCase());
  const poiNames = nearbyPOIs.map(poi => poi.name.toLowerCase());
  
  // Check geocoding info
  const locationText = (geocodingInfo?.name || '').toLowerCase() + ' ' + (geocodingInfo?.address || '').toLowerCase();
  
  // Castle detection
  if (
    poiTypes.some(type => type.includes('castle')) ||
    poiNames.some(name => name.includes('castle')) ||
    locationText.includes('castle')
  ) {
    return LocationType.CASTLE;
  }
  
  // Graveyard/Cemetery detection
  if (
    poiTypes.some(type => type.includes('cemetery') || type.includes('graveyard')) ||
    poiNames.some(name => name.includes('cemetery') || name.includes('graveyard') || name.includes('burial')) ||
    locationText.includes('cemetery') || locationText.includes('graveyard')
  ) {
    return LocationType.GRAVEYARD;
  }
  
  // Abandoned building detection (harder to detect automatically)
  if (
    poiNames.some(name => name.includes('abandoned') || name.includes('ruins') || name.includes('derelict')) ||
    locationText.includes('abandoned') || locationText.includes('ruins')
  ) {
    return LocationType.ABANDONED_BUILDING;
  }
  
  // Fort detection
  if (
    poiTypes.some(type => type.includes('fort') || type.includes('military')) ||
    poiNames.some(name => name.includes('fort') || name.includes('fortress') || name.includes('citadel')) ||
    locationText.includes('fort') || locationText.includes('fortress')
  ) {
    return LocationType.FORT;
  }
  
  // Default to regular location
  return LocationType.REGULAR;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) * Math.cos(toRadians(coord2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1000); // Return distance in meters
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Search for a location by name using Mapbox Geocoding
 */
export async function searchLocationByName(query: string): Promise<Location[]> {
  if (!config.mapboxAccessToken) {
    throw createError('Mapbox access token not configured', 500);
  }
  
  try {
    const url = `${config.mapboxGeocodingBaseUrl}/${encodeURIComponent(query)}.json`;
    const params = {
      access_token: config.mapboxAccessToken,
      limit: 5,
      types: 'poi,address,place'
    };
    
    console.log(`[API CALL] Searching for location: ${query}`);
    const response = await axios.get<MapboxGeocodingResponse>(url, { 
      params,
      timeout: 5000 
    });
    
    const locations = await Promise.all(
      response.data.features.map(async (feature) => {
        const coordinates = {
          latitude: feature.center[1],
          longitude: feature.center[0]
        };
        
        return analyzeLocation(coordinates, feature.text);
      })
    );
    
    return locations;
    
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw createError('Invalid Mapbox access token', 401);
    } else if (error.response?.status === 429) {
      throw createError('Geocoding API rate limit exceeded', 429);
    } else {
      throw createError('Failed to search for location', 500);
    }
  }
}