import NodeCache from 'node-cache';
import { config } from '../config/index.js';

// Create cache instances for different data types
export const weatherCache = new NodeCache({ 
  stdTTL: config.weatherCacheTtl,
  checkperiod: 120 // Check for expired keys every 2 minutes
});

export const locationCache = new NodeCache({ 
  stdTTL: config.locationCacheTtl,
  checkperiod: 300 // Check for expired keys every 5 minutes
});

export const ratingCache = new NodeCache({ 
  stdTTL: config.cacheDefaultTtl,
  checkperiod: 60 // Check for expired keys every minute
});

/**
 * Generates a cache key from coordinates
 */
export const generateCoordinateKey = (lat: number, lng: number, precision: number = 3): string => {
  const roundedLat = Math.round(lat * Math.pow(10, precision)) / Math.pow(10, precision);
  const roundedLng = Math.round(lng * Math.pow(10, precision)) / Math.pow(10, precision);
  return `${roundedLat},${roundedLng}`;
};

/**
 * Generates a cache key for weather data
 */
export const generateWeatherKey = (lat: number, lng: number): string => {
  return `weather:${generateCoordinateKey(lat, lng)}`;
};

/**
 * Generates a cache key for location data
 */
export const generateLocationKey = (lat: number, lng: number): string => {
  return `location:${generateCoordinateKey(lat, lng, 4)}`;
};

/**
 * Generates a cache key for rating data
 */
export const generateRatingKey = (lat: number, lng: number, timestamp?: string): string => {
  const timeKey = timestamp ? new Date(timestamp).getHours() : new Date().getHours();
  return `rating:${generateCoordinateKey(lat, lng)}:${timeKey}`;
};

/**
 * Cache statistics for monitoring
 */
export const getCacheStats = () => {
  return {
    weather: {
      keys: weatherCache.keys().length,
      hits: weatherCache.getStats().hits,
      misses: weatherCache.getStats().misses
    },
    location: {
      keys: locationCache.keys().length,
      hits: locationCache.getStats().hits,
      misses: locationCache.getStats().misses
    },
    rating: {
      keys: ratingCache.keys().length,
      hits: ratingCache.getStats().hits,
      misses: ratingCache.getStats().misses
    }
  };
};