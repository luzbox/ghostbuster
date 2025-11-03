// Environmental factors service for real-time data aggregation
import type { 
  EnvironmentalFactors
} from '../types';
import { Season, WeatherCondition } from '../types';
import { getCurrentEnvironmentalFactors, clearExpiredCache } from './weatherService';

// Auto-refresh interval (30 minutes)
const AUTO_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

// Active sessions tracking for auto-refresh
interface ActiveSession {
  coordinates: { latitude: number; longitude: number };
  lastUpdate: number;
  refreshTimer?: NodeJS.Timeout;
  onUpdate?: (factors: EnvironmentalFactors) => void;
}

const activeSessions = new Map<string, ActiveSession>();

/**
 * Generate session key for tracking
 */
const getSessionKey = (lat: number, lon: number): string => {
  return `session_${lat.toFixed(4)}_${lon.toFixed(4)}`;
};

/**
 * Calculate season based on date and hemisphere
 * More detailed implementation than the weather service
 */
export const calculateSeason = (date: Date = new Date(), latitude: number = 0): Season => {
  const month = date.getMonth(); // 0-11
  const day = date.getDate();
  const isNorthernHemisphere = latitude >= 0;
  
  // More precise seasonal boundaries
  const getSeasonForNorthern = (month: number, day: number): Season => {
    if (month < 2 || (month === 2 && day < 20)) return Season.WINTER;
    if (month < 5 || (month === 5 && day < 21)) return Season.SPRING;
    if (month < 8 || (month === 8 && day < 23)) return Season.SUMMER;
    if (month < 11 || (month === 11 && day < 21)) return Season.AUTUMN;
    return Season.WINTER;
  };
  
  if (isNorthernHemisphere) {
    return getSeasonForNorthern(month, day);
  } else {
    // Southern hemisphere seasons are opposite
    const northernSeason = getSeasonForNorthern(month, day);
    switch (northernSeason) {
      case Season.SPRING: return Season.AUTUMN;
      case Season.SUMMER: return Season.WINTER;
      case Season.AUTUMN: return Season.SPRING;
      case Season.WINTER: return Season.SUMMER;
      default: return Season.SPRING;
    }
  }
};

/**
 * Calculate time-based factors
 */
export const calculateTimeFactors = (
  date: Date = new Date(), 
  timezoneOffset: number = 0
): { hour: number; isNighttime: boolean; timezone: string } => {
  // Adjust for timezone
  const localTime = new Date(date.getTime() + (timezoneOffset * 1000));
  const hour = localTime.getUTCHours();
  
  // Determine if it's nighttime (6 PM to 6 AM)
  const isNighttime = hour < 6 || hour >= 18;
  
  // Format timezone string
  const offsetHours = timezoneOffset / 3600;
  const timezone = `UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`;
  
  return { hour, isNighttime, timezone };
};

/**
 * Get comprehensive environmental factors for a location
 */
export const getEnvironmentalFactors = async (
  coordinates: { latitude: number; longitude: number },
  _useCache: boolean = true
): Promise<EnvironmentalFactors> => {
  try {
    // Get weather-based environmental factors
    const factors = await getCurrentEnvironmentalFactors(coordinates);
    
    // Enhance with more precise calculations
    const now = new Date();
    const enhancedTimeFactors = calculateTimeFactors(now);
    const enhancedSeason = calculateSeason(now, coordinates.latitude);
    
    return {
      ...factors,
      time: {
        ...factors.time,
        ...enhancedTimeFactors
      },
      season: enhancedSeason
    };
  } catch (error) {
    console.error('Failed to get environmental factors:', error);
    
    // Fallback to basic calculations without weather data
    const now = new Date();
    const timeFactors = calculateTimeFactors(now);
    const season = calculateSeason(now, coordinates.latitude);
    
    return {
      weather: {
        condition: WeatherCondition.CLEAR,
        temperature: 20,
        visibility: 10,
        precipitation: false,
        humidity: 50,
        windSpeed: 5
      },
      time: timeFactors,
      season
    };
  }
};

/**
 * Start auto-refresh for a location session
 */
export const startAutoRefresh = (
  coordinates: { latitude: number; longitude: number },
  onUpdate?: (factors: EnvironmentalFactors) => void
): string => {
  const sessionKey = getSessionKey(coordinates.latitude, coordinates.longitude);
  
  // Clear existing session if any
  stopAutoRefresh(sessionKey);
  
  const session: ActiveSession = {
    coordinates,
    lastUpdate: Date.now(),
    onUpdate
  };
  
  // Set up auto-refresh timer
  session.refreshTimer = setInterval(async () => {
    try {
      const factors = await getEnvironmentalFactors(coordinates, false); // Force fresh data
      session.lastUpdate = Date.now();
      
      if (session.onUpdate) {
        session.onUpdate(factors);
      }
      
      console.log(`Auto-refreshed environmental factors for ${sessionKey}`);
    } catch (error) {
      console.error(`Auto-refresh failed for ${sessionKey}:`, error);
    }
  }, AUTO_REFRESH_INTERVAL);
  
  activeSessions.set(sessionKey, session);
  
  console.log(`Started auto-refresh for ${sessionKey}`);
  return sessionKey;
};

/**
 * Stop auto-refresh for a session
 */
export const stopAutoRefresh = (sessionKey: string): void => {
  const session = activeSessions.get(sessionKey);
  
  if (session?.refreshTimer) {
    clearInterval(session.refreshTimer);
    activeSessions.delete(sessionKey);
    console.log(`Stopped auto-refresh for ${sessionKey}`);
  }
};

/**
 * Stop auto-refresh by coordinates
 */
export const stopAutoRefreshByCoordinates = (
  coordinates: { latitude: number; longitude: number }
): void => {
  const sessionKey = getSessionKey(coordinates.latitude, coordinates.longitude);
  stopAutoRefresh(sessionKey);
};

/**
 * Get active session info
 */
export const getActiveSession = (sessionKey: string): ActiveSession | undefined => {
  return activeSessions.get(sessionKey);
};

/**
 * Get all active sessions
 */
export const getActiveSessions = (): Map<string, ActiveSession> => {
  return new Map(activeSessions);
};

/**
 * Update refresh callback for an existing session
 */
export const updateSessionCallback = (
  sessionKey: string,
  onUpdate: (factors: EnvironmentalFactors) => void
): boolean => {
  const session = activeSessions.get(sessionKey);
  
  if (session) {
    session.onUpdate = onUpdate;
    return true;
  }
  
  return false;
};

/**
 * Force refresh for a specific session
 */
export const forceRefresh = async (sessionKey: string): Promise<EnvironmentalFactors | null> => {
  const session = activeSessions.get(sessionKey);
  
  if (!session) {
    return null;
  }
  
  try {
    const factors = await getEnvironmentalFactors(session.coordinates, false);
    session.lastUpdate = Date.now();
    
    if (session.onUpdate) {
      session.onUpdate(factors);
    }
    
    return factors;
  } catch (error) {
    console.error(`Force refresh failed for ${sessionKey}:`, error);
    throw error;
  }
};

/**
 * Clean up expired sessions and cache
 */
export const cleanup = (): void => {
  // Clear expired weather cache
  clearExpiredCache();
  
  // Clean up inactive sessions (older than 2 hours)
  const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
  
  for (const [sessionKey, session] of activeSessions.entries()) {
    if (session.lastUpdate < twoHoursAgo) {
      stopAutoRefresh(sessionKey);
      console.log(`Cleaned up inactive session: ${sessionKey}`);
    }
  }
};

/**
 * Get environmental factors with session management
 * This is the main function to use for getting environmental data with auto-refresh
 */
export const getEnvironmentalFactorsWithSession = async (
  coordinates: { latitude: number; longitude: number },
  enableAutoRefresh: boolean = true,
  onUpdate?: (factors: EnvironmentalFactors) => void
): Promise<{ factors: EnvironmentalFactors; sessionKey?: string }> => {
  const factors = await getEnvironmentalFactors(coordinates);
  
  let sessionKey: string | undefined;
  
  if (enableAutoRefresh) {
    sessionKey = startAutoRefresh(coordinates, onUpdate);
  }
  
  return { factors, sessionKey };
};

/**
 * Calculate time until next auto-refresh for a session
 */
export const getTimeUntilNextRefresh = (sessionKey: string): number | null => {
  const session = activeSessions.get(sessionKey);
  
  if (!session) {
    return null;
  }
  
  const nextRefresh = session.lastUpdate + AUTO_REFRESH_INTERVAL;
  const timeUntilRefresh = nextRefresh - Date.now();
  
  return Math.max(0, timeUntilRefresh);
};

/**
 * Get session statistics for debugging
 */
export const getSessionStats = () => {
  const sessions = Array.from(activeSessions.values());
  const now = Date.now();
  
  return {
    totalSessions: sessions.length,
    averageAge: sessions.length > 0 
      ? sessions.reduce((sum, s) => sum + (now - s.lastUpdate), 0) / sessions.length 
      : 0,
    oldestSession: sessions.length > 0 
      ? Math.max(...sessions.map(s => now - s.lastUpdate)) 
      : 0,
    newestSession: sessions.length > 0 
      ? Math.min(...sessions.map(s => now - s.lastUpdate)) 
      : 0
  };
};

// Set up periodic cleanup (every hour)
setInterval(cleanup, 60 * 60 * 1000);

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Stop all active sessions
    for (const sessionKey of activeSessions.keys()) {
      stopAutoRefresh(sessionKey);
    }
  });
}