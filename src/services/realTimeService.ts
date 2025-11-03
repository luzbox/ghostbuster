// Real-time data update service with 30-minute refresh intervals
import { calculateHauntedRating } from './api';
import { HauntedRating, Location, EnvironmentalFactors } from '../types';

// Auto-refresh interval (30 minutes)
const AUTO_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

// Active sessions tracking for auto-refresh
interface ActiveSession {
  location: Location;
  lastUpdate: number;
  refreshTimer?: NodeJS.Timeout;
  onRatingUpdate?: (rating: HauntedRating) => void;
  onEnvironmentalUpdate?: (factors: EnvironmentalFactors) => void;
  onError?: (error: string) => void;
}

const activeSessions = new Map<string, ActiveSession>();

// Cache for fallback data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const ratingCache = new Map<string, CacheEntry<HauntedRating>>();
const environmentalCache = new Map<string, CacheEntry<EnvironmentalFactors>>();

const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours for fallback cache

/**
 * Generate session key for tracking
 */
const getSessionKey = (location: Location): string => {
  return `session_${location.coordinates.latitude.toFixed(4)}_${location.coordinates.longitude.toFixed(4)}`;
};

/**
 * Generate cache key
 */
const getCacheKey = (location: Location): string => {
  return `cache_${location.coordinates.latitude.toFixed(4)}_${location.coordinates.longitude.toFixed(4)}`;
};

/**
 * Check if cache entry is valid
 */
const isCacheValid = <T>(entry: CacheEntry<T>): boolean => {
  return Date.now() < entry.expiresAt;
};

/**
 * Get cached data if available and valid
 */
const getCachedData = <T>(cache: Map<string, CacheEntry<T>>, key: string): T | null => {
  const cached = cache.get(key);
  
  if (cached && isCacheValid(cached)) {
    return cached.data;
  }
  
  // Clean up expired cache entry
  if (cached) {
    cache.delete(key);
  }
  
  return null;
};

/**
 * Cache data with expiration
 */
const cacheData = <T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_DURATION
  });
};

/**
 * Refresh data for a session
 */
const refreshSessionData = async (sessionKey: string): Promise<void> => {
  const session = activeSessions.get(sessionKey);
  
  if (!session) {
    return;
  }

  const cacheKey = getCacheKey(session.location);
  
  try {
    console.log(`[REAL-TIME] Refreshing data for ${session.location.name}`);
    
    // Calculate new haunted rating
    const ratingResponse = await calculateHauntedRating({
      coordinates: session.location.coordinates,
      locationName: session.location.name,
      timestamp: new Date().toISOString()
    });

    const rating = ratingResponse.data;
    session.lastUpdate = Date.now();
    
    // Cache the new rating
    cacheData(ratingCache, cacheKey, rating as any);
    
    // Notify callback
    if (session.onRatingUpdate && rating) {
      session.onRatingUpdate(rating as any);
    }
    
    console.log(`[REAL-TIME] Successfully refreshed rating for ${session.location.name}: ${(rating as any)?.overallScore || 'unknown'}/100`);
    
  } catch (error: any) {
    console.error(`[REAL-TIME] Failed to refresh data for ${session.location.name}:`, error);
    
    // Try to use cached data as fallback
    const cachedRating = getCachedData(ratingCache, cacheKey);
    
    if (cachedRating && session.onRatingUpdate) {
      console.log(`[REAL-TIME] Using cached rating for ${session.location.name}`);
      session.onRatingUpdate(cachedRating);
    } else if (session.onError) {
      session.onError(`Failed to refresh data: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Start auto-refresh for a location
 */
export const startAutoRefresh = (
  location: Location,
  callbacks: {
    onRatingUpdate?: (rating: HauntedRating) => void;
    onEnvironmentalUpdate?: (factors: EnvironmentalFactors) => void;
    onError?: (error: string) => void;
  }
): string => {
  const sessionKey = getSessionKey(location);
  
  // Clear existing session if any
  stopAutoRefresh(sessionKey);
  
  const session: ActiveSession = {
    location,
    lastUpdate: Date.now(),
    ...callbacks
  };
  
  // Set up auto-refresh timer
  session.refreshTimer = setInterval(() => {
    refreshSessionData(sessionKey);
  }, AUTO_REFRESH_INTERVAL);
  
  activeSessions.set(sessionKey, session);
  
  console.log(`[REAL-TIME] Started auto-refresh for ${location.name} (${sessionKey})`);
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
    console.log(`[REAL-TIME] Stopped auto-refresh for ${sessionKey}`);
  }
};

/**
 * Stop auto-refresh by location
 */
export const stopAutoRefreshByLocation = (location: Location): void => {
  const sessionKey = getSessionKey(location);
  stopAutoRefresh(sessionKey);
};

/**
 * Force refresh for a specific session
 */
export const forceRefresh = async (sessionKey: string): Promise<HauntedRating | null> => {
  const session = activeSessions.get(sessionKey);
  
  if (!session) {
    return null;
  }
  
  try {
    const ratingResponse = await calculateHauntedRating({
      coordinates: session.location.coordinates,
      locationName: session.location.name,
      timestamp: new Date().toISOString()
    });

    const rating = ratingResponse.data;
    session.lastUpdate = Date.now();
    
    // Cache the new rating
    const cacheKey = getCacheKey(session.location);
    cacheData(ratingCache, cacheKey, rating as any);
    
    if (session.onRatingUpdate && rating) {
      session.onRatingUpdate(rating as any);
    }
    
    return rating as any;
  } catch (error: any) {
    console.error(`[REAL-TIME] Force refresh failed for ${sessionKey}:`, error);
    
    if (session.onError) {
      session.onError(`Failed to refresh data: ${error.message || 'Unknown error'}`);
    }
    
    throw error;
  }
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
 * Update callbacks for an existing session
 */
export const updateSessionCallbacks = (
  sessionKey: string,
  callbacks: {
    onRatingUpdate?: (rating: HauntedRating) => void;
    onEnvironmentalUpdate?: (factors: EnvironmentalFactors) => void;
    onError?: (error: string) => void;
  }
): boolean => {
  const session = activeSessions.get(sessionKey);
  
  if (session) {
    Object.assign(session, callbacks);
    return true;
  }
  
  return false;
};

/**
 * Get cached rating with fallback
 */
export const getCachedRating = (location: Location): HauntedRating | null => {
  const cacheKey = getCacheKey(location);
  return getCachedData(ratingCache, cacheKey);
};

/**
 * Get cached environmental factors with fallback
 */
export const getCachedEnvironmentalFactors = (location: Location): EnvironmentalFactors | null => {
  const cacheKey = getCacheKey(location);
  return getCachedData(environmentalCache, cacheKey);
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
 * Clean up expired cache entries and inactive sessions
 */
export const cleanup = (): void => {
  // Clear expired cache entries
  const now = Date.now();
  
  for (const [key, entry] of ratingCache.entries()) {
    if (entry.expiresAt < now) {
      ratingCache.delete(key);
    }
  }
  
  for (const [key, entry] of environmentalCache.entries()) {
    if (entry.expiresAt < now) {
      environmentalCache.delete(key);
    }
  }
  
  // Clean up inactive sessions (older than 4 hours)
  const fourHoursAgo = now - (4 * 60 * 60 * 1000);
  
  for (const [sessionKey, session] of activeSessions.entries()) {
    if (session.lastUpdate < fourHoursAgo) {
      stopAutoRefresh(sessionKey);
      console.log(`[REAL-TIME] Cleaned up inactive session: ${sessionKey}`);
    }
  }
};

/**
 * Get session and cache statistics for debugging
 */
export const getStats = () => {
  const sessions = Array.from(activeSessions.values());
  const now = Date.now();
  
  return {
    activeSessions: sessions.length,
    cachedRatings: ratingCache.size,
    cachedEnvironmental: environmentalCache.size,
    averageSessionAge: sessions.length > 0 
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