// Location types
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  coordinates: Coordinates;
  name: string;
  type: LocationType;
  nearbyPOIs: PointOfInterest[];
  address: string;
}

export enum LocationType {
  CASTLE = 'castle',
  ABANDONED_BUILDING = 'abandoned_building',
  FORT = 'fort',
  GRAVEYARD = 'graveyard',
  REGULAR = 'regular'
}

export interface PointOfInterest {
  name: string;
  type: string;
  distance: number;
}

// Environmental factors
export interface EnvironmentalFactors {
  weather: WeatherData;
  time: TimeData;
  season: Season;
}

export interface WeatherData {
  condition: WeatherCondition;
  temperature: number;
  visibility: number;
  precipitation: boolean;
  humidity: number;
  windSpeed: number;
}

export enum WeatherCondition {
  CLEAR = 'clear',
  CLOUDY = 'cloudy',
  RAINY = 'rainy',
  FOGGY = 'foggy',
  STORMY = 'stormy'
}

export interface TimeData {
  hour: number;
  isNighttime: boolean;
  timezone: string;
  localTime: string;
}

export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  AUTUMN = 'autumn',
  WINTER = 'winter'
}

// Haunted rating
export interface HauntedRating {
  overallScore: number; // 0-100
  factors: {
    locationScore: number;
    weatherScore: number;
    timeScore: number;
    seasonScore: number;
  };
  breakdown: FactorBreakdown[];
  calculatedAt: Date;
  location: Location;
  environmental: EnvironmentalFactors;
  explanation?: string;
}

export interface FactorBreakdown {
  factor: string;
  weight: number;
  contribution: number;
  description: string;
}

// API request/response types
export interface RatingCalculationRequest {
  coordinates?: Coordinates;
  locationName?: string;
  timestamp?: string;
}

export interface RatingCalculationResponse {
  success: boolean;
  data?: HauntedRating;
  error?: string;
  cached?: boolean;
}

export interface LocationAnalysisRequest {
  coordinates?: Coordinates;
  locationName?: string;
}

export interface LocationAnalysisResponse {
  success: boolean;
  data?: Location;
  error?: string;
  cached?: boolean;
}

export interface WeatherRequest {
  coordinates: Coordinates;
}

export interface WeatherResponse {
  success: boolean;
  data?: WeatherData;
  error?: string;
  cached?: boolean;
}

// External API response types
export interface OpenWeatherMapResponse {
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
  rain?: {
    '1h': number;
  };
  snow?: {
    '1h': number;
  };
}

export interface GooglePlacesResponse {
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

export interface MapboxGeocodingResponse {
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