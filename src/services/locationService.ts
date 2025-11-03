// Location and geocoding service integration
import type { 
  Location, 
  PointOfInterest,
  PlacesApiResponse,
  GeocodingApiResponse,
  LocationSearchResult,
  CacheEntry,
  LocationCache
} from '../types';
import { LocationType } from '../types';
import { ApiError } from './api';

const GOOGLE_PLACES_API_KEY = (import.meta as any).env?.VITE_GOOGLE_PLACES_API_KEY;
const MAPBOX_ACCESS_TOKEN = (import.meta as any).env?.VITE_MAPBOX_ACCESS_TOKEN;
const PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';
const MAPBOX_GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// In-memory cache for location data
const locationCache: LocationCache = {};

/**
 * Generate cache key for location data
 */
const getLocationCacheKey = (lat: number, lon: number): string => {
  return `location_${lat.toFixed(4)}_${lon.toFixed(4)}`;
};

const getSearchCacheKey = (query: string): string => {
  return `search_${query.toLowerCase().replace(/\s+/g, '_')}`;
};

/**
 * Check if cache entry is valid
 */
const isCacheValid = <T>(entry: CacheEntry<T>): boolean => {
  return Date.now() < entry.expiresAt;
};

/**
 * Get cached location data if available and valid
 */
const getCachedLocation = (key: string): Location | null => {
  const cached = locationCache[key];
  
  if (cached && isCacheValid(cached)) {
    return cached.data;
  }
  
  // Clean up expired cache entry
  if (cached) {
    delete locationCache[key];
  }
  
  return null;
};

/**
 * Cache location data
 */
const cacheLocationData = (key: string, data: Location): void => {
  locationCache[key] = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_DURATION
  };
};

/**
 * Map Google Places types to our LocationType enum
 */
const mapPlaceTypeToLocationType = (types: string[]): LocationType => {
  const typeSet = new Set(types.map(t => t.toLowerCase()));
  
  // Check for specific spooky location types
  if (typeSet.has('cemetery') || typeSet.has('funeral_home')) {
    return LocationType.GRAVEYARD;
  }
  
  if (typeSet.has('tourist_attraction') || typeSet.has('museum')) {
    // Check if it might be a castle or fort based on name patterns
    // This is a heuristic approach since Google Places doesn't have specific castle/fort types
    return LocationType.CASTLE; // We'll refine this in the name-based detection
  }
  
  if (typeSet.has('establishment') && (
    typeSet.has('point_of_interest') || 
    typeSet.has('premise')
  )) {
    return LocationType.ABANDONED_BUILDING; // Potential abandoned building
  }
  
  return LocationType.REGULAR;
};

/**
 * Refine location type based on name and description
 */
const refineLocationTypeByName = (name: string, initialType: LocationType): LocationType => {
  const nameLower = name.toLowerCase();
  
  // Castle detection
  if (nameLower.includes('castle') || nameLower.includes('château') || 
      nameLower.includes('palace') || nameLower.includes('manor')) {
    return LocationType.CASTLE;
  }
  
  // Fort detection
  if (nameLower.includes('fort') || nameLower.includes('fortress') || 
      nameLower.includes('citadel') || nameLower.includes('stronghold')) {
    return LocationType.FORT;
  }
  
  // Graveyard detection
  if (nameLower.includes('cemetery') || nameLower.includes('graveyard') || 
      nameLower.includes('burial') || nameLower.includes('tomb')) {
    return LocationType.GRAVEYARD;
  }
  
  // Abandoned building detection
  if (nameLower.includes('abandoned') || nameLower.includes('ruins') || 
      nameLower.includes('derelict') || nameLower.includes('haunted')) {
    return LocationType.ABANDONED_BUILDING;
  }
  
  return initialType;
};

/**
 * Search for places using Google Places Text Search API
 */
const searchPlacesWithGoogle = async (query: string): Promise<PlacesApiResponse> => {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new ApiError(
      'Google Places API key not configured',
      'MISSING_API_KEY',
      {},
      false
    );
  }

  const url = `${PLACES_BASE_URL}/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new ApiError(
        `Places API error: ${response.status}`,
        `PLACES_API_${response.status}`,
        {},
        response.status >= 500 || response.status === 429
      );
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new ApiError(
        data.error_message || `Places API error: ${data.status}`,
        `PLACES_API_${data.status}`,
        data,
        data.status === 'OVER_QUERY_LIMIT'
      );
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      'Failed to search places',
      'PLACES_SEARCH_ERROR',
      { originalError: error },
      true
    );
  }
};

/**
 * Geocode using Mapbox Geocoding API
 */
const geocodeWithMapbox = async (query: string): Promise<GeocodingApiResponse> => {
  console.log('🔍 Geocoding with Mapbox:', query);
  
  if (!MAPBOX_ACCESS_TOKEN) {
    console.error('❌ Mapbox token missing');
    throw new ApiError(
      'Mapbox access token not configured',
      'MISSING_API_KEY',
      {},
      false
    );
  }

  // For reverse geocoding (coordinates), don't use limit parameter
  // For forward geocoding (text search), use limit parameter
  const isReverseGeocoding = query.match(/^-?\d+\.?\d*,-?\d+\.?\d*$/);
  const url = isReverseGeocoding 
    ? `${MAPBOX_GEOCODING_URL}/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=poi,address,place`
    : `${MAPBOX_GEOCODING_URL}/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=5`;
  console.log('🌐 Mapbox URL:', url);
  
  try {
    const response = await fetch(url);
    console.log('📡 Mapbox response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Mapbox API error:', response.status, errorText);
      throw new ApiError(
        `Mapbox Geocoding error: ${response.status}`,
        `MAPBOX_API_${response.status}`,
        {},
        response.status >= 500 || response.status === 429
      );
    }
    
    const data = await response.json();
    console.log('✅ Mapbox response:', data);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      'Failed to geocode location',
      'GEOCODING_ERROR',
      { originalError: error },
      true
    );
  }
};

/**
 * Get nearby points of interest using Google Places Nearby Search
 */
const getNearbyPOIs = async (lat: number, lon: number): Promise<PointOfInterest[]> => {
  if (!GOOGLE_PLACES_API_KEY) {
    return []; // Return empty array if no API key
  }

  const url = `${PLACES_BASE_URL}/nearbysearch/json?location=${lat},${lon}&radius=1000&type=point_of_interest&key=${GOOGLE_PLACES_API_KEY}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn('Failed to fetch nearby POIs:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.warn('Places API error for POIs:', data.status);
      return [];
    }
    
    return data.results.slice(0, 5).map((place: any) => ({
      name: place.name,
      type: place.types[0] || 'point_of_interest',
      distance: calculateDistance(lat, lon, place.geometry.location.lat, place.geometry.location.lng)
    }));
  } catch (error) {
    console.warn('Error fetching nearby POIs:', error);
    return [];
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Transform Google Places result to Location
 */
const transformPlacesToLocation = async (place: any): Promise<Location> => {
  const initialType = mapPlaceTypeToLocationType(place.types);
  const refinedType = refineLocationTypeByName(place.name, initialType);
  
  const nearbyPOIs = await getNearbyPOIs(
    place.geometry.location.lat, 
    place.geometry.location.lng
  );
  
  return {
    coordinates: {
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng
    },
    name: place.name,
    type: refinedType,
    nearbyPOIs,
    address: place.formatted_address
  };
};

/**
 * Transform Mapbox geocoding result to Location
 */
const transformMapboxToLocation = async (feature: any): Promise<Location> => {
  const [longitude, latitude] = feature.center;
  const name = feature.text || feature.place_name;
  
  // Determine location type based on place type and name
  let locationType = LocationType.REGULAR;
  
  if (feature.properties?.category) {
    const category = feature.properties.category.toLowerCase();
    if (category.includes('cemetery')) {
      locationType = LocationType.GRAVEYARD;
    }
  }
  
  locationType = refineLocationTypeByName(name, locationType);
  
  const nearbyPOIs = await getNearbyPOIs(latitude, longitude);
  
  return {
    coordinates: { latitude, longitude },
    name,
    type: locationType,
    nearbyPOIs,
    address: feature.place_name
  };
};

/**
 * Search for locations by query string
 */
export const searchLocations = async (query: string): Promise<LocationSearchResult[]> => {
  const cacheKey = getSearchCacheKey(query);
  const cached = getCachedLocation(cacheKey);
  
  if (cached) {
    return [cached];
  }
  
  const results: LocationSearchResult[] = [];
  let placesError: any = null;
  
  try {
    // Try Google Places first for better POI detection
    try {
      const placesData = await searchPlacesWithGoogle(query);
      
      if (placesData.results && placesData.results.length > 0) {
        for (const place of placesData.results.slice(0, 3)) {
          const location = await transformPlacesToLocation(place);
          results.push(location);
          
          // Cache the first result
          if (results.length === 1) {
            cacheLocationData(cacheKey, location);
          }
        }
      }
    } catch (error) {
      placesError = error;
      console.warn('Google Places search failed, trying Mapbox:', error);
    }
    
    // If no results from Places or Places failed, try Mapbox
    if (results.length === 0) {
      try {
        const mapboxData = await geocodeWithMapbox(query);
        
        if (mapboxData.features && mapboxData.features.length > 0) {
          for (const feature of mapboxData.features.slice(0, 3)) {
            const location = await transformMapboxToLocation(feature);
            results.push(location);
            
            // Cache the first result
            if (results.length >= 1) {
              cacheLocationData(cacheKey, location);
            }
          }
        }
      } catch (mapboxError) {
        console.error('Mapbox geocoding also failed:', mapboxError);
        throw new ApiError(
          'All location services failed',
          'ALL_SERVICES_FAILED',
          { placesError, mapboxError },
          true
        );
      }
    }
    
    return results;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      'Location search failed',
      'SEARCH_ERROR',
      { originalError: error },
      true
    );
  }
};

/**
 * Analyze a specific coordinate location
 */
export const analyzeLocation = async (
  coordinates: { latitude: number; longitude: number }
): Promise<Location> => {
  console.log('🎯 Analyzing location:', coordinates);
  
  const { latitude, longitude } = coordinates;
  const cacheKey = getLocationCacheKey(latitude, longitude);
  const cached = getCachedLocation(cacheKey);
  
  if (cached) {
    console.log('💾 Using cached location:', cached.name);
    return cached;
  }
  
  try {
    // Try reverse geocoding with Mapbox first
    const reverseQuery = `${longitude},${latitude}`;
    console.log('🔄 Starting Mapbox geocoding...');
    const mapboxData = await geocodeWithMapbox(reverseQuery);
    
    if (mapboxData.features && mapboxData.features.length > 0) {
      const location = await transformMapboxToLocation(mapboxData.features[0]);
      cacheLocationData(cacheKey, location);
      
      return location;
    }
    
    // Fallback: create a basic location with nearby POIs
    const nearbyPOIs = await getNearbyPOIs(latitude, longitude);
    
    const location: Location = {
      coordinates: { latitude, longitude },
      name: `Location ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      type: LocationType.REGULAR,
      nearbyPOIs,
      address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    };
    
    cacheLocationData(cacheKey, location);
    
    return location;
  } catch (error) {
    throw new ApiError(
      'Failed to analyze location',
      'ANALYSIS_ERROR',
      { originalError: error },
      true
    );
  }
};

/**
 * Clear expired cache entries
 */
export const clearExpiredLocationCache = (): void => {
  const now = Date.now();
  Object.keys(locationCache).forEach(key => {
    if (locationCache[key].expiresAt < now) {
      delete locationCache[key];
    }
  });
};

/**
 * Get cache statistics for debugging
 */
export const getLocationCacheStats = () => {
  const entries = Object.values(locationCache);
  const validEntries = entries.filter(entry => isCacheValid(entry));
  
  return {
    totalEntries: entries.length,
    validEntries: validEntries.length,
    expiredEntries: entries.length - validEntries.length
  };
};