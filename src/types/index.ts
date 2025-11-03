export enum LocationType {
  CASTLE = 'castle',
  GRAVEYARD = 'graveyard',
  ABANDONED_BUILDING = 'abandoned_building',
  FOREST = 'forest',
  HOSPITAL = 'hospital',
  FORT = 'fort',
  REGULAR = 'regular'
}

export enum WeatherCondition {
  CLEAR = 'clear',
  CLOUDY = 'cloudy',
  RAINY = 'rainy',
  FOGGY = 'foggy',
  STORMY = 'stormy'
}

export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  AUTUMN = 'autumn',
  WINTER = 'winter'
}

export interface WeatherData {
  condition: WeatherCondition;
  temperature: number;
  visibility: number;
  precipitation: boolean;
  humidity: number;
  windSpeed: number;
}

export interface TimeData {
  hour: number;
  isNighttime: boolean;
  timezone: string;
  localTime?: string;
}

export interface EnvironmentalFactors {
  weather: WeatherData;
  time: TimeData;
  season: Season;
}

export interface Location {
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  type: LocationType;
  nearbyPOIs: Array<{
    name: string;
    type: string;
    distance: number;
  }>;
}

export interface HauntedRating {
  overallScore: number;
  factors: {
    locationScore: number;
    weatherScore: number;
    timeScore: number;
    seasonScore: number;
  };
  breakdown: FactorBreakdown[];
  calculatedAt: Date;
}

export interface FactorBreakdown {
  factor: string;
  weight: number;
  contribution: number;
  description: string;
}

export interface WeatherApiResponse {
  weather: Array<{
    main: string;
    description: string;
  }>;
  main: {
    temp: number;
    humidity: number;
  };
  visibility?: number;
  wind: {
    speed: number;
  };
  rain?: {
    '1h': number;
  };
  snow?: {
    '1h': number;
  };
  sys?: {
    sunrise: number;
    sunset: number;
  };
  coord?: {
    lat: number;
    lon: number;
  };
  timezone?: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface WeatherCache {
  [key: string]: CacheEntry<WeatherData>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode?: number;
}

export interface RatingCalculationRequest {
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  locationName?: string;
  timestamp?: string;
}

export interface RatingCalculationResponse {
  success: boolean;
  data?: HauntedRating;
  error?: string;
  cached?: boolean;
}

export interface LocationSearchResult {
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  type: LocationType;
  placeId?: string;
}

export interface PointOfInterest {
  name: string;
  type: string;
  distance: number;
}

export interface PlacesApiResponse {
  results: Array<{
    name: string;
    types: string[];
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    place_id: string;
  }>;
  status: string;
}

export interface GeocodingApiResponse {
  features: Array<{
    place_name: string;
    center: [number, number];
    properties: {
      category?: string;
    };
    context: Array<{
      id: string;
      text: string;
    }>;
  }>;
}

export interface LocationCache {
  [key: string]: CacheEntry<Location>;
}

// Additional missing types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
}

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export interface RatingCalculationRequest {
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  locationName?: string;
  timestamp?: string;
}

export interface RatingCalculationResponse {
  success: boolean;
  data?: HauntedRating;
  error?: string;
  cached?: boolean;
}

// Removed duplicate LocationSearchResult interface

export interface PointOfInterest {
  name: string;
  type: string;
  distance: number;
}

export interface PlacesApiResponse {
  results: Array<{
    name: string;
    types: string[];
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    place_id: string;
  }>;
  status: string;
}

export interface GeocodingApiResponse {
  features: Array<{
    place_name: string;
    center: [number, number];
    properties: {
      category?: string;
    };
    context: Array<{
      id: string;
      text: string;
    }>;
  }>;
}

