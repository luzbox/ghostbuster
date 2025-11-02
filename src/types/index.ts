export interface Location {
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  type: string;
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