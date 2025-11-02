import { Coordinates, LocationType, WeatherCondition, Season } from '../types/index.js';

/**
 * Validates coordinates are within valid ranges
 */
export const validateCoordinates = (coordinates: Coordinates): boolean => {
  const { latitude, longitude } = coordinates;
  return (
    latitude >= -90 && 
    latitude <= 90 && 
    longitude >= -180 && 
    longitude <= 180
  );
};

/**
 * Validates location type is a valid enum value
 */
export const validateLocationType = (type: string): type is LocationType => {
  return Object.values(LocationType).includes(type as LocationType);
};

/**
 * Validates weather condition is a valid enum value
 */
export const validateWeatherCondition = (condition: string): condition is WeatherCondition => {
  return Object.values(WeatherCondition).includes(condition as WeatherCondition);
};

/**
 * Validates season is a valid enum value
 */
export const validateSeason = (season: string): season is Season => {
  return Object.values(Season).includes(season as Season);
};

/**
 * Validates haunted rating score is within valid range
 */
export const validateHauntedScore = (score: number): boolean => {
  return score >= 0 && score <= 100 && !isNaN(score);
};

/**
 * Sanitizes location name input
 */
export const sanitizeLocationName = (name: string): string => {
  return name.trim().replace(/[<>\"']/g, '');
};

/**
 * Validates API key format (basic check)
 */
export const validateApiKey = (key: string): boolean => {
  return typeof key === 'string' && key.length > 10 && key.trim() === key;
};