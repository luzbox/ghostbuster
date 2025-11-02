import axios from 'axios';
import { config } from '../config/index.js';
import { weatherCache, generateWeatherKey } from '../utils/cache.js';
import { createError } from '../middleware/errorHandler.js';
import { 
  WeatherData, 
  WeatherCondition, 
  Coordinates, 
  OpenWeatherMapResponse 
} from '../types/index.js';

/**
 * Fetch current weather data from OpenWeatherMap API
 */
export async function getCurrentWeather(coordinates: Coordinates): Promise<WeatherData> {
  const cacheKey = generateWeatherKey(coordinates.latitude, coordinates.longitude);
  
  // Check cache first
  const cachedWeather = weatherCache.get<WeatherData>(cacheKey);
  if (cachedWeather) {
    console.log(`[CACHE HIT] Weather data for ${cacheKey}`);
    return cachedWeather;
  }
  
  if (!config.openWeatherApiKey) {
    throw createError('OpenWeatherMap API key not configured', 500);
  }
  
  try {
    const url = `${config.openWeatherBaseUrl}/weather`;
    const params = {
      lat: coordinates.latitude,
      lon: coordinates.longitude,
      appid: config.openWeatherApiKey,
      units: 'metric' // Celsius
    };
    
    console.log(`[API CALL] Fetching weather for ${coordinates.latitude}, ${coordinates.longitude}`);
    const response = await axios.get<OpenWeatherMapResponse>(url, { 
      params,
      timeout: 5000 
    });
    
    const weatherData = transformWeatherResponse(response.data);
    
    // Cache the result
    weatherCache.set(cacheKey, weatherData);
    console.log(`[CACHE SET] Weather data cached for ${cacheKey}`);
    
    return weatherData;
    
  } catch (error: any) {
    if (error.response) {
      // API returned an error response
      const status = error.response.status;
      const message = error.response.data?.message || 'Weather API error';
      
      if (status === 401) {
        throw createError('Invalid OpenWeatherMap API key', 401);
      } else if (status === 404) {
        throw createError('Location not found in weather service', 404);
      } else if (status === 429) {
        throw createError('Weather API rate limit exceeded', 429);
      } else {
        throw createError(`Weather API error: ${message}`, status);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw createError('Weather API request timeout', 408);
    } else {
      throw createError('Failed to fetch weather data', 500);
    }
  }
}

/**
 * Transform OpenWeatherMap API response to our WeatherData format
 */
function transformWeatherResponse(response: OpenWeatherMapResponse): WeatherData {
  const weather = response.weather[0];
  const main = response.main;
  
  // Map OpenWeatherMap conditions to our enum
  const condition = mapWeatherCondition(weather.main.toLowerCase());
  
  // Check for precipitation
  const precipitation = !!(response.rain || response.snow);
  
  return {
    condition,
    temperature: Math.round(main.temp),
    visibility: response.visibility || 10000, // Default to 10km if not provided
    precipitation,
    humidity: main.humidity,
    windSpeed: response.wind?.speed || 0
  };
}

/**
 * Map OpenWeatherMap weather conditions to our WeatherCondition enum
 */
function mapWeatherCondition(condition: string): WeatherCondition {
  const conditionMap: Record<string, WeatherCondition> = {
    'clear': WeatherCondition.CLEAR,
    'clouds': WeatherCondition.CLOUDY,
    'rain': WeatherCondition.RAINY,
    'drizzle': WeatherCondition.RAINY,
    'thunderstorm': WeatherCondition.STORMY,
    'snow': WeatherCondition.RAINY, // Treat snow as rainy for haunted purposes
    'mist': WeatherCondition.FOGGY,
    'fog': WeatherCondition.FOGGY,
    'haze': WeatherCondition.FOGGY,
    'dust': WeatherCondition.CLOUDY,
    'sand': WeatherCondition.CLOUDY,
    'ash': WeatherCondition.CLOUDY,
    'squall': WeatherCondition.STORMY,
    'tornado': WeatherCondition.STORMY
  };
  
  return conditionMap[condition] || WeatherCondition.CLEAR;
}

/**
 * Get weather description for debugging/logging
 */
export function getWeatherDescription(weather: WeatherData): string {
  return `${weather.condition} weather, ${weather.temperature}°C, visibility ${weather.visibility}m, ${weather.precipitation ? 'with' : 'no'} precipitation`;
}