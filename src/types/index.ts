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
  localTime: string;
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
  visibility: number;
  wind: {
    speed: number;
  };
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface WeatherCache {
  [key: string]: CacheEntry<WeatherData>;
}