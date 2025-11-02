export enum LocationType {
  CASTLE = 'castle',
  GRAVEYARD = 'graveyard',
  ABANDONED_BUILDING = 'abandoned_building',
  FOREST = 'forest',
  HOSPITAL = 'hospital'
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

export interface EnvironmentalFactors {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  visibility: number;
  weather: WeatherCondition;
  season: Season;
  timeOfDay: number; // 0-23 hours
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