// Base API service configuration and utilities
import type { 
  ApiResponse, 
  ApiError as ApiErrorType,
  RatingCalculationRequest,
  RatingCalculationResponse,
  LocationSearchResult
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Enhanced caching system
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + (ttl || this.defaultTTL)
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.expiresAt - Date.now()
      }))
    };
  }
}

const apiCache = new ApiCache();

// Cleanup expired cache entries every 5 minutes
setInterval(() => apiCache.cleanup(), 5 * 60 * 1000);

export class ApiError extends Error implements ApiErrorType {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generate cache key for requests
 */
const getCacheKey = (endpoint: string, options: RequestInit = {}): string => {
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : '';
  return `${method}:${endpoint}:${body}`;
};

/**
 * Base fetch wrapper with error handling and caching
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  cacheTTL?: number
): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const cacheKey = getCacheKey(endpoint, options);
  
  // Check cache for GET requests
  if ((!options.method || options.method === 'GET') && apiCache.has(cacheKey)) {
    const cachedData = apiCache.get<ApiResponse<T>>(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] ${endpoint}`);
      return {
        ...cachedData,
        cached: true
      };
    }
  }
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json();
    
    if (!response.ok) {
      throw new ApiError(
        data.error || `HTTP ${response.status}: ${response.statusText}`,
        `HTTP_${response.status}`,
        data,
        response.status >= 500 || response.status === 429
      );
    }

    const result = data as ApiResponse<T>;
    
    // Cache successful GET requests
    if ((!options.method || options.method === 'GET') && result.success) {
      apiCache.set(cacheKey, result, cacheTTL);
      console.log(`[CACHE SET] ${endpoint}`);
    }

    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      'Network error or server unavailable',
      'NETWORK_ERROR',
      { originalError: error },
      true
    );
  }
};

/**
 * GET request helper with caching
 */
export const get = <T>(endpoint: string, params?: Record<string, string>, cacheTTL?: number): Promise<ApiResponse<T>> => {
  const url = params 
    ? `${endpoint}?${new URLSearchParams(params).toString()}`
    : endpoint;
    
  return apiRequest<T>(url, { method: 'GET' }, cacheTTL);
};

/**
 * POST request helper
 */
export const post = <T>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * PUT request helper
 */
export const put = <T>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * DELETE request helper
 */
export const del = <T>(endpoint: string): Promise<ApiResponse<T>> => {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
};

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Retry wrapper for API requests
 */
const withRetry = async <T>(
  operation: () => Promise<ApiResponse<T>>,
  retries: number = MAX_RETRIES
): Promise<ApiResponse<T>> => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ApiError && error.retryable && retries > 0) {
      console.log(`Retrying API request, ${retries} attempts remaining...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return withRetry(operation, retries - 1);
    }
    throw error;
  }
};

// Specific API endpoints using our types with caching
export const calculateHauntedRating = (request: RatingCalculationRequest): Promise<ApiResponse<RatingCalculationResponse>> => {
  return withRetry(() => post<RatingCalculationResponse>('/rating/calculate', request));
};

export const searchLocation = (query: string): Promise<ApiResponse<LocationSearchResult[]>> => {
  // Cache search results for 10 minutes
  return withRetry(() => get<LocationSearchResult[]>('/location/search', { q: query }, 10 * 60 * 1000));
};

export const analyzeLocation = (coordinates: { latitude: number; longitude: number }): Promise<ApiResponse<LocationSearchResult>> => {
  // Cache location analysis for 30 minutes
  return withRetry(() => get<LocationSearchResult>('/location/analyze', {
    lat: coordinates.latitude.toString(),
    lng: coordinates.longitude.toString()
  }, 30 * 60 * 1000));
};

export const getCurrentWeather = (coordinates: { latitude: number; longitude: number }): Promise<ApiResponse<any>> => {
  // Cache weather for 15 minutes
  return withRetry(() => get<any>('/weather/current', {
    lat: coordinates.latitude.toString(),
    lng: coordinates.longitude.toString()
  }, 15 * 60 * 1000));
};

export const getEnvironmentalFactors = (coordinates: { latitude: number; longitude: number }, timestamp?: string): Promise<ApiResponse<any>> => {
  const params: Record<string, string> = {
    lat: coordinates.latitude.toString(),
    lng: coordinates.longitude.toString()
  };
  
  if (timestamp) {
    params.timestamp = timestamp;
  }
  
  // Cache environmental factors for 15 minutes
  return withRetry(() => get<any>('/weather/environmental', params, 15 * 60 * 1000));
};

// Cache management utilities
export const clearApiCache = (): void => {
  apiCache.clear();
};

export const getApiCacheStats = () => {
  return apiCache.getStats();
};