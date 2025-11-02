import {
  Location,
  LocationType,
  EnvironmentalFactors,
  WeatherCondition,
  Season,
  HauntedRating,
  FactorBreakdown
} from '../types/index.js';

// Factor weights as specified in the design document
const FACTOR_WEIGHTS = {
  LOCATION: 0.4,   // 40%
  WEATHER: 0.25,   // 25%
  TIME: 0.25,      // 25%
  SEASON: 0.1      // 10%
} as const;

// Location type scoring (0-100)
const LOCATION_SCORES: Record<LocationType, number> = {
  [LocationType.CASTLE]: 90,
  [LocationType.GRAVEYARD]: 85,
  [LocationType.ABANDONED_BUILDING]: 80,
  [LocationType.FORT]: 70,
  [LocationType.REGULAR]: 10
};

// Weather condition scoring (0-100)
const WEATHER_SCORES: Record<WeatherCondition, number> = {
  [WeatherCondition.FOGGY]: 90,
  [WeatherCondition.STORMY]: 80,
  [WeatherCondition.RAINY]: 70,
  [WeatherCondition.CLOUDY]: 40,
  [WeatherCondition.CLEAR]: 10
};

// Season scoring (0-100)
const SEASON_SCORES: Record<Season, number> = {
  [Season.AUTUMN]: 80,
  [Season.WINTER]: 70,
  [Season.SPRING]: 30,
  [Season.SUMMER]: 20
};

/**
 * Calculate location score based on location type
 */
export function getLocationScore(locationType: LocationType): number {
  return LOCATION_SCORES[locationType] || 10;
}

/**
 * Calculate weather score based on weather conditions
 */
export function getWeatherScore(weather: EnvironmentalFactors['weather']): number {
  let baseScore = WEATHER_SCORES[weather.condition] || 10;
  
  // Temperature modifier: colder = spookier
  if (weather.temperature < 10) {
    baseScore += 10; // Very cold bonus
  } else if (weather.temperature < 20) {
    baseScore += 5;  // Cold bonus
  }
  
  // Visibility modifier: lower visibility = spookier
  if (weather.visibility < 1000) {
    baseScore += 15; // Very low visibility bonus
  } else if (weather.visibility < 5000) {
    baseScore += 8;  // Low visibility bonus
  }
  
  // Precipitation bonus
  if (weather.precipitation) {
    baseScore += 5;
  }
  
  return Math.min(100, baseScore);
}

/**
 * Calculate time score based on time of day
 */
export function getTimeScore(time: EnvironmentalFactors['time']): number {
  const hour = time.hour;
  
  // Midnight to 3 AM: Maximum spookiness
  if (hour >= 0 && hour < 3) {
    return 100;
  }
  
  // 9 PM to Midnight: High spookiness
  if (hour >= 21 || hour < 1) {
    return 80;
  }
  
  // 6 PM to 9 PM: Moderate spookiness (twilight)
  if (hour >= 18 && hour < 21) {
    return 60;
  }
  
  // 3 AM to 6 AM: Early morning spookiness
  if (hour >= 3 && hour < 6) {
    return 70;
  }
  
  // Daytime: Low spookiness
  return 10;
}

/**
 * Calculate season score
 */
export function getSeasonScore(season: Season): number {
  return SEASON_SCORES[season] || 20;
}

/**
 * Main function to calculate haunted rating with weighted scoring system
 */
export function calculateHauntedRating(
  location: Location,
  environmental: EnvironmentalFactors
): HauntedRating {
  // Calculate individual factor scores
  const locationScore = getLocationScore(location.type);
  const weatherScore = getWeatherScore(environmental.weather);
  const timeScore = getTimeScore(environmental.time);
  const seasonScore = getSeasonScore(environmental.season);
  
  // Apply weights and calculate overall score
  const weightedLocationScore = locationScore * FACTOR_WEIGHTS.LOCATION;
  const weightedWeatherScore = weatherScore * FACTOR_WEIGHTS.WEATHER;
  const weightedTimeScore = timeScore * FACTOR_WEIGHTS.TIME;
  const weightedSeasonScore = seasonScore * FACTOR_WEIGHTS.SEASON;
  
  const overallScore = Math.min(100, Math.round(
    weightedLocationScore + 
    weightedWeatherScore + 
    weightedTimeScore + 
    weightedSeasonScore
  ));
  
  return {
    overallScore,
    factors: {
      locationScore: Math.round(locationScore),
      weatherScore: Math.round(weatherScore),
      timeScore: Math.round(timeScore),
      seasonScore: Math.round(seasonScore)
    },
    breakdown: [], // Will be populated by the breakdown system
    calculatedAt: new Date()
  };
}
/**
 * Gen
erate factor breakdown with explanations
 */
export function generateFactorBreakdown(
  location: Location,
  environmental: EnvironmentalFactors,
  rating: HauntedRating
): FactorBreakdown[] {
  const breakdown: FactorBreakdown[] = [];
  
  // Location factor breakdown
  breakdown.push({
    factor: 'Location Type',
    weight: FACTOR_WEIGHTS.LOCATION,
    contribution: Math.round(rating.factors.locationScore * FACTOR_WEIGHTS.LOCATION),
    description: getLocationDescription(location.type)
  });
  
  // Weather factor breakdown
  breakdown.push({
    factor: 'Weather Conditions',
    weight: FACTOR_WEIGHTS.WEATHER,
    contribution: Math.round(rating.factors.weatherScore * FACTOR_WEIGHTS.WEATHER),
    description: getWeatherDescription(environmental.weather)
  });
  
  // Time factor breakdown
  breakdown.push({
    factor: 'Time of Day',
    weight: FACTOR_WEIGHTS.TIME,
    contribution: Math.round(rating.factors.timeScore * FACTOR_WEIGHTS.TIME),
    description: getTimeDescription(environmental.time)
  });
  
  // Season factor breakdown
  breakdown.push({
    factor: 'Season',
    weight: FACTOR_WEIGHTS.SEASON,
    contribution: Math.round(rating.factors.seasonScore * FACTOR_WEIGHTS.SEASON),
    description: getSeasonDescription(environmental.season)
  });
  
  return breakdown;
}

/**
 * Generate location type description
 */
function getLocationDescription(locationType: LocationType): string {
  const descriptions: Record<LocationType, string> = {
    [LocationType.CASTLE]: 'Ancient castles are steeped in history and countless tales of tragedy, making them prime locations for supernatural activity. This location type has extremely high paranormal potential.',
    [LocationType.GRAVEYARD]: 'Graveyards and cemeteries are traditional gathering places for spirits, with strong connections to the afterlife. This location type has extremely high paranormal potential.',
    [LocationType.ABANDONED_BUILDING]: 'Abandoned structures often harbor residual energy from past inhabitants and traumatic events. This location type has very high paranormal potential.',
    [LocationType.FORT]: 'Military fortifications carry the weight of battles fought and lives lost, creating powerful spiritual imprints. This location type has high paranormal potential.',
    [LocationType.REGULAR]: 'Regular locations have minimal supernatural associations, though spirits can manifest anywhere. This location type has limited paranormal potential.'
  };
  
  return descriptions[locationType];
}

/**
 * Generate weather condition description
 */
function getWeatherDescription(weather: EnvironmentalFactors['weather']): string {
  const conditionDescriptions: Record<WeatherCondition, string> = {
    [WeatherCondition.FOGGY]: 'Dense fog creates an otherworldly atmosphere that spirits find conducive to manifestation.',
    [WeatherCondition.STORMY]: 'Electrical storms generate energy that can amplify supernatural phenomena and spirit activity.',
    [WeatherCondition.RAINY]: 'Rain and moisture create atmospheric conditions that enhance spiritual sensitivity.',
    [WeatherCondition.CLOUDY]: 'Overcast skies provide a neutral backdrop with some atmospheric enhancement.',
    [WeatherCondition.CLEAR]: 'Clear weather offers minimal atmospheric enhancement for paranormal activity.'
  };
  
  let description = conditionDescriptions[weather.condition];
  
  // Add temperature context
  if (weather.temperature < 10) {
    description += ' The frigid temperature adds to the eerie atmosphere.';
  } else if (weather.temperature < 20) {
    description += ' The cold air enhances the supernatural ambiance.';
  }
  
  // Add visibility context
  if (weather.visibility < 1000) {
    description += ' Extremely poor visibility creates perfect conditions for ghostly encounters.';
  } else if (weather.visibility < 5000) {
    description += ' Limited visibility adds mystery to the environment.';
  }
  
  // Add precipitation context
  if (weather.precipitation) {
    description += ' Active precipitation heightens the supernatural atmosphere.';
  }
  
  return description;
}

/**
 * Generate time of day description
 */
function getTimeDescription(time: EnvironmentalFactors['time']): string {
  const hour = time.hour;
  
  if (hour >= 0 && hour < 3) {
    return 'The witching hours between midnight and 3 AM are when the veil between worlds is thinnest, allowing maximum spiritual activity.';
  } else if (hour >= 21 || hour < 1) {
    return 'Late evening hours create an atmosphere of mystery and heightened supernatural sensitivity.';
  } else if (hour >= 18 && hour < 21) {
    return 'Twilight hours mark the transition from day to night, a time when spirits become more active.';
  } else if (hour >= 3 && hour < 6) {
    return 'The pre-dawn hours maintain some of the night\'s supernatural energy as darkness begins to fade.';
  } else {
    return 'Daylight hours generally suppress supernatural activity, though determined spirits may still manifest.';
  }
}

/**
 * Generate season description
 */
function getSeasonDescription(season: Season): string {
  const descriptions: Record<Season, string> = {
    [Season.AUTUMN]: 'Autumn\'s association with death and decay, plus proximity to Halloween, creates peak conditions for supernatural encounters.',
    [Season.WINTER]: 'Winter\'s long nights and harsh conditions provide extended periods of darkness favored by spirits.',
    [Season.SPRING]: 'Spring represents renewal and life, which tends to diminish supernatural activity as nature awakens.',
    [Season.SUMMER]: 'Summer\'s warmth and extended daylight hours are least conducive to paranormal phenomena.'
  };
  
  return descriptions[season];
}

/**
 * Enhanced calculateHauntedRating function that includes breakdown generation
 */
export function calculateHauntedRatingWithBreakdown(
  location: Location,
  environmental: EnvironmentalFactors
): HauntedRating {
  // Calculate base rating
  const rating = calculateHauntedRating(location, environmental);
  
  // Generate detailed breakdown
  const breakdown = generateFactorBreakdown(location, environmental, rating);
  
  return {
    ...rating,
    breakdown
  };
}

/**
 * Get a human-readable explanation of the overall rating
 */
export function getRatingExplanation(overallScore: number): string {
  if (overallScore >= 90) {
    return 'Extremely haunted - This location shows maximum paranormal potential with multiple factors aligning for intense supernatural activity.';
  } else if (overallScore >= 75) {
    return 'Highly haunted - Strong paranormal indicators suggest frequent supernatural encounters are likely at this location.';
  } else if (overallScore >= 60) {
    return 'Moderately haunted - Several factors contribute to notable paranormal potential with possible spirit manifestations.';
  } else if (overallScore >= 40) {
    return 'Mildly haunted - Some paranormal indicators present, though supernatural activity may be sporadic or subtle.';
  } else if (overallScore >= 25) {
    return 'Low paranormal activity - Limited supernatural potential with minimal contributing factors.';
  } else {
    return 'Minimal haunting - Very low paranormal potential with few factors supporting supernatural activity.';
  }
}