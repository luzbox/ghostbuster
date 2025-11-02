import { EnvironmentalFactors, Season, Coordinates, TimeData } from '../types/index.js';
import { getCurrentWeather } from './weatherService.js';

/**
 * Get complete environmental factors for a location
 */
export async function getEnvironmentalFactors(coordinates: Coordinates, timestamp?: string): Promise<EnvironmentalFactors> {
  const targetDate = timestamp ? new Date(timestamp) : new Date();
  
  // Get weather data
  const weather = await getCurrentWeather(coordinates);
  
  // Calculate time data
  const time = calculateTimeData(coordinates, targetDate);
  
  // Calculate season
  const season = calculateSeason(targetDate, coordinates.latitude);
  
  return {
    weather,
    time,
    season
  };
}

/**
 * Calculate time-related data for a location
 */
function calculateTimeData(coordinates: Coordinates, date: Date): TimeData {
  // Estimate timezone offset based on longitude
  // This is a rough approximation - in production, you'd use a proper timezone API
  const timezoneOffset = Math.round(coordinates.longitude / 15);
  const localDate = new Date(date.getTime() + (timezoneOffset * 60 * 60 * 1000));
  
  const hour = localDate.getHours();
  const isNighttime = hour < 6 || hour >= 18; // 6 PM to 6 AM is considered nighttime
  
  // Generate timezone string (simplified)
  const timezone = `UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`;
  
  return {
    hour,
    isNighttime,
    timezone,
    localTime: localDate.toISOString()
  };
}

/**
 * Calculate season based on date and hemisphere
 */
function calculateSeason(date: Date, latitude: number): Season {
  const month = date.getMonth(); // 0-11
  const isNorthernHemisphere = latitude >= 0;
  
  if (isNorthernHemisphere) {
    // Northern hemisphere seasons
    if (month >= 2 && month <= 4) {
      return Season.SPRING; // March, April, May
    } else if (month >= 5 && month <= 7) {
      return Season.SUMMER; // June, July, August
    } else if (month >= 8 && month <= 10) {
      return Season.AUTUMN; // September, October, November
    } else {
      return Season.WINTER; // December, January, February
    }
  } else {
    // Southern hemisphere seasons (opposite)
    if (month >= 2 && month <= 4) {
      return Season.AUTUMN; // March, April, May
    } else if (month >= 5 && month <= 7) {
      return Season.WINTER; // June, July, August
    } else if (month >= 8 && month <= 10) {
      return Season.SPRING; // September, October, November
    } else {
      return Season.SUMMER; // December, January, February
    }
  }
}

/**
 * Get current season for a location
 */
export function getCurrentSeason(coordinates: Coordinates): Season {
  return calculateSeason(new Date(), coordinates.latitude);
}

/**
 * Check if it's currently nighttime at a location
 */
export function isNighttime(coordinates: Coordinates, date?: Date): boolean {
  const targetDate = date || new Date();
  const timeData = calculateTimeData(coordinates, targetDate);
  return timeData.isNighttime;
}

/**
 * Get local time for a location
 */
export function getLocalTime(coordinates: Coordinates, date?: Date): TimeData {
  const targetDate = date || new Date();
  return calculateTimeData(coordinates, targetDate);
}

/**
 * Calculate how many hours until the next "witching hour" (midnight-3AM)
 */
export function getHoursUntilWitchingHour(coordinates: Coordinates): number {
  const timeData = calculateTimeData(coordinates, new Date());
  const currentHour = timeData.hour;
  
  if (currentHour >= 0 && currentHour < 3) {
    // Already in witching hours
    return 0;
  } else if (currentHour >= 3 && currentHour < 24) {
    // Hours until midnight
    return 24 - currentHour;
  }
  
  return 0;
}

/**
 * Get environmental factor summary for debugging
 */
export function getEnvironmentalSummary(environmental: EnvironmentalFactors): string {
  const { weather, time, season } = environmental;
  
  return `${season} season, ${time.hour}:00 local time (${time.isNighttime ? 'nighttime' : 'daytime'}), ${weather.condition} weather at ${weather.temperature}°C`;
}