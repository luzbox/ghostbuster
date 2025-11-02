// Weather service integration with OpenWeatherMap API
import type { 
  EnvironmentalFactors, 
  WeatherApiResponse,
  CacheEntry,
  WeatherCache
} from '../types';
import { WeatherCondition, Season } from '../types';
import { ApiError } from './api';

const OPENWEATHER_API_KEY = (import.meta as any).env?.VITE_OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// In-memory cache for weather data
const weatherCache: WeatherCache = {};

/**
 * Generate cache key for weather data
 */
const getCacheKey = (lat: number, lon: number): string => {
  return `weather_${lat.toFixed(4)}_${lon.toFixed(4)}`;
};

/**
 * Check if cache entry is valid
 */
const isCacheValid = <T>(entry: CacheEntry<T>): boolean => {
  return Date.now() < entry.expiresAt;
};

/**
 * Get cached weather data if available and valid
 */
const getCachedWeather = (lat: number, lon: number): EnvironmentalFactors | null => {
  const cacheKey = getCacheKey(lat, lon);
  const cached = weatherCache[cacheKey];
  
  if (cached && isCacheValid(cached)) {
    return cached.data;
  }
  
  // Clean up expired cache entry
  if (cached) {
    delete weatherCache[cacheKey];
  }
  
  return null;
};

/**
 * Cache weather data
 */
const cacheWeatherData = (lat: number, lon: number, data: EnvironmentalFactors): void => {
  const cacheKey = getCacheKey(lat, lon);
  weatherCache[cacheKey] = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_DURATION
  };
};

/**
 * Map OpenWeatherMap condition to our WeatherCondition enum
 */
const mapWeatherCondition = (weatherData: WeatherApiResponse): WeatherCondition => {
  const mainCondition = weatherData.weather[0]?.main.toLowerCase();
  const description = weatherData.weather[0]?.description.toLowerCase();
  
  // Check for fog/mist conditions
  if (description.includes('fog') || description.includes('mist') || 
      mainCondition === 'fog' || mainCondition === 'mist') {
    return WeatherCondition.FOGGY;
  }
  
  // Check for stormy conditions
  if (mainCondition === 'thunderstorm' || description.includes('storm')) {
    return WeatherCondition.STORMY;
  }
  
  // Check for rainy conditions
  if (mainCondition === 'rain' || mainCondition === 'drizzle' || 
      mainCondition === 'snow' || description.includes('rain') || 
      description.includes('snow')) {
    return WeatherCondition.RAINY;
  }
  
  // Check for cloudy conditions
  if (mainCondition === 'clouds' || description.includes('cloud')) {
    return WeatherCondition.CLOUDY;
  }
  
  // Default to clear
  return WeatherCondition.CLEAR;
};

/**
 * Calculate current season based on date and hemisphere
 */
const calculateSeason = (date: Date, latitude: number): Season => {
  const month = date.getMonth(); // 0-11
  const isNorthernHemisphere = latitude >= 0;
  
  if (isNorthernHemisphere) {
    if (month >= 2 && month <= 4) return Season.SPRING; // Mar-May
    if (month >= 5 && month <= 7) return Season.SUMMER; // Jun-Aug
    if (month >= 8 && month <= 10) return Season.AUTUMN; // Sep-Nov
    return Season.WINTER; // Dec-Feb
  } else {
    // Southern hemisphere seasons are opposite
    if (month >= 2 && month <= 4) return Season.AUTUMN; // Mar-May
    if (month >= 5 && month <= 7) return Season.WINTER; // Jun-Aug
    if (month >= 8 && month <= 10) return Season.SPRING; // Sep-Nov
    return Season.SUMMER; // Dec-Feb
  }
};

/**
 * Determine if it's nighttime based on sunrise/sunset times
 */
const isNighttime = (currentTime: number, sunrise: number, sunset: number): boolean => {
  return currentTime < sunrise || currentTime > sunset;
};

/**
 * Fetch weather data from OpenWeatherMap API
 */
const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherApiResponse> => {
  if (!OPENWEATHER_API_KEY) {
    throw new ApiError(
      'OpenWeatherMap API key not configured',
      'MISSING_API_KEY',
      {},
      false
    );
  }

  const url = `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `Weather API error: ${response.status}`,
        `WEATHER_API_${response.status}`,
        errorData,
        response.status >= 500 || response.status === 429
      );
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      'Failed to fetch weather data',
      'WEATHER_FETCH_ERROR',
      { originalError: error },
      true
    );
  }
};

/**
 * Transform weather API response to EnvironmentalFactors
 */
const transformWeatherData = (weatherData: WeatherApiResponse): EnvironmentalFactors => {
  const currentTime = Date.now() / 1000; // Unix timestamp
  const currentDate = new Date();
  
  // Calculate timezone-adjusted hour
  const timezoneOffsetSeconds = weatherData.timezone;
  const localTime = new Date((currentTime + timezoneOffsetSeconds) * 1000);
  const hour = localTime.getUTCHours();
  
  return {
    weather: {
      condition: mapWeatherCondition(weatherData),
      temperature: Math.round(weatherData.main.temp),
      visibility: weatherData.main.visibility ? weatherData.main.visibility / 1000 : 10, // Convert to km
      precipitation: !!(weatherData.rain || weatherData.snow)
    },
    time: {
      hour,
      isNighttime: isNighttime(currentTime, weatherData.sys.sunrise, weatherData.sys.sunset),
      timezone: `UTC${timezoneOffsetSeconds >= 0 ? '+' : ''}${timezoneOffsetSeconds / 3600}`
    },
    season: calculateSeason(currentDate, weatherData.coord.lat)
  };
};

/**
 * Get current environmental factors for a location
 */
export const getCurrentEnvironmentalFactors = async (
  coordinates: { latitude: number; longitude: number }
): Promise<EnvironmentalFactors> => {
  const { latitude, longitude } = coordinates;
  
  // Check cache first
  const cached = getCachedWeather(latitude, longitude);
  if (cached) {
    return cached;
  }
  
  try {
    // Fetch fresh data from API
    const weatherData = await fetchWeatherData(latitude, longitude);
    const environmentalFactors = transformWeatherData(weatherData);
    
    // Cache the result
    cacheWeatherData(latitude, longitude, environmentalFactors);
    
    return environmentalFactors;
  } catch (error) {
    // If API fails, try to return stale cached data as fallback
    const cacheKey = getCacheKey(latitude, longitude);
    const staleCache = weatherCache[cacheKey];
    
    if (staleCache) {
      console.warn('Weather API failed, using stale cached data', error);
      return staleCache.data;
    }
    
    // If no cache available, return default environmental factors
    console.error('Weather API failed and no cached data available', error);
    
    const now = new Date();
    const hour = now.getHours();
    
    return {
      weather: {
        condition: WeatherCondition.CLEAR,
        temperature: 20,
        visibility: 10,
        precipitation: false
      },
      time: {
        hour,
        isNighttime: hour < 6 || hour > 20,
        timezone: 'UTC+0'
      },
      season: calculateSeason(now, latitude)
    };
  }
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = (): void => {
  const now = Date.now();
  Object.keys(weatherCache).forEach(key => {
    if (weatherCache[key].expiresAt < now) {
      delete weatherCache[key];
    }
  });
};

/**
 * Get cache statistics for debugging
 */
export const getCacheStats = () => {
  const entries = Object.values(weatherCache);
  const validEntries = entries.filter(entry => isCacheValid(entry));
  
  return {
    totalEntries: entries.length,
    validEntries: validEntries.length,
    expiredEntries: entries.length - validEntries.length
  };
};