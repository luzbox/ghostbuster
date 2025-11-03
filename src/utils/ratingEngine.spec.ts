/**
 * Unit tests for the haunted rating calculation engine
 * This file validates the core functionality without external test frameworks
 */

import {
  calculateHauntedRating,
  calculateHauntedRatingWithBreakdown,
  getLocationScore,
  getWeatherScore,
  getTimeScore,
  getSeasonScore,
  getRatingExplanation
} from './ratingEngine.js';
import {
  Location,
  LocationType,
  EnvironmentalFactors,
  WeatherCondition,
  Season
} from '../types/index.js';

// Simple assertion function
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Test data
const testLocation: Location = {
  coordinates: { latitude: 40.7128, longitude: -74.0060 },
  name: 'Test Location',
  type: LocationType.REGULAR,
  nearbyPOIs: [],
  address: 'Test Address'
};

const baseEnvironmental: EnvironmentalFactors = {
  weather: {
    condition: WeatherCondition.CLEAR,
    temperature: 20,
    visibility: 10000,
    precipitation: false,
    humidity: 50,
    windSpeed: 5
  },
  time: {
    hour: 12,
    isNighttime: false,
    timezone: 'America/New_York',
    localTime: '12:00:00 PM'
  },
  season: Season.SUMMER
};

// Test location scoring
function testLocationScoring(): void {
  console.log('Testing location scoring...');
  
  assert(getLocationScore(LocationType.CASTLE) === 90, 'Castle should score 90');
  assert(getLocationScore(LocationType.GRAVEYARD) === 85, 'Graveyard should score 85');
  assert(getLocationScore(LocationType.ABANDONED_BUILDING) === 80, 'Abandoned building should score 80');
  assert(getLocationScore(LocationType.FORT) === 70, 'Fort should score 70');
  assert(getLocationScore(LocationType.REGULAR) === 10, 'Regular location should score 10');
  
  console.log('✓ Location scoring tests passed');
}

// Test weather scoring
function testWeatherScoring(): void {
  console.log('Testing weather scoring...');
  
  // Base weather conditions
  const clearWeather = { ...baseEnvironmental.weather, condition: WeatherCondition.CLEAR };
  const foggyWeather = { ...baseEnvironmental.weather, condition: WeatherCondition.FOGGY };
  const stormyWeather = { ...baseEnvironmental.weather, condition: WeatherCondition.STORMY };
  
  assert(getWeatherScore(clearWeather) === 10, 'Clear weather should score 10');
  assert(getWeatherScore(foggyWeather) === 90, 'Foggy weather should score 90');
  assert(getWeatherScore(stormyWeather) === 80, 'Stormy weather should score 80');
  
  // Test temperature modifiers
  const coldWeather = { ...clearWeather, temperature: 5 };
  const veryColdWeather = { ...clearWeather, temperature: -5 };
  
  assert(getWeatherScore(coldWeather) === 15, 'Cold weather should add 5 points');
  assert(getWeatherScore(veryColdWeather) === 20, 'Very cold weather should add 10 points');
  
  // Test visibility modifiers
  const lowVisibility = { ...clearWeather, visibility: 3000 };
  const veryLowVisibility = { ...clearWeather, visibility: 500 };
  
  assert(getWeatherScore(lowVisibility) === 18, 'Low visibility should add 8 points');
  assert(getWeatherScore(veryLowVisibility) === 25, 'Very low visibility should add 15 points');
  
  // Test precipitation bonus
  const rainyWeather = { ...clearWeather, precipitation: true };
  assert(getWeatherScore(rainyWeather) === 15, 'Precipitation should add 5 points');
  
  console.log('✓ Weather scoring tests passed');
}

// Test time scoring
function testTimeScoring(): void {
  console.log('Testing time scoring...');
  
  // Witching hours (midnight to 3 AM)
  assert(getTimeScore({ hour: 0, isNighttime: true, timezone: 'UTC', localTime: '12:00 AM' }) === 100, 'Midnight should score 100');
  assert(getTimeScore({ hour: 1, isNighttime: true, timezone: 'UTC', localTime: '1:00 AM' }) === 100, '1 AM should score 100');
  assert(getTimeScore({ hour: 2, isNighttime: true, timezone: 'UTC', localTime: '2:00 AM' }) === 100, '2 AM should score 100');
  
  // Late evening (9 PM to midnight)
  assert(getTimeScore({ hour: 21, isNighttime: true, timezone: 'UTC', localTime: '9:00 PM' }) === 80, '9 PM should score 80');
  assert(getTimeScore({ hour: 22, isNighttime: true, timezone: 'UTC', localTime: '10:00 PM' }) === 80, '10 PM should score 80');
  assert(getTimeScore({ hour: 23, isNighttime: true, timezone: 'UTC', localTime: '11:00 PM' }) === 80, '11 PM should score 80');
  
  // Twilight (6 PM to 9 PM)
  assert(getTimeScore({ hour: 18, isNighttime: false, timezone: 'UTC', localTime: '6:00 PM' }) === 60, '6 PM should score 60');
  assert(getTimeScore({ hour: 19, isNighttime: false, timezone: 'UTC', localTime: '7:00 PM' }) === 60, '7 PM should score 60');
  assert(getTimeScore({ hour: 20, isNighttime: false, timezone: 'UTC', localTime: '8:00 PM' }) === 60, '8 PM should score 60');
  
  // Early morning (3 AM to 6 AM)
  assert(getTimeScore({ hour: 3, isNighttime: true, timezone: 'UTC', localTime: '3:00 AM' }) === 70, '3 AM should score 70');
  assert(getTimeScore({ hour: 4, isNighttime: true, timezone: 'UTC', localTime: '4:00 AM' }) === 70, '4 AM should score 70');
  assert(getTimeScore({ hour: 5, isNighttime: true, timezone: 'UTC', localTime: '5:00 AM' }) === 70, '5 AM should score 70');
  
  // Daytime
  assert(getTimeScore({ hour: 12, isNighttime: false, timezone: 'UTC', localTime: '12:00 PM' }) === 10, 'Noon should score 10');
  
  console.log('✓ Time scoring tests passed');
}

// Test season scoring
function testSeasonScoring(): void {
  console.log('Testing season scoring...');
  
  assert(getSeasonScore(Season.AUTUMN) === 80, 'Autumn should score 80');
  assert(getSeasonScore(Season.WINTER) === 70, 'Winter should score 70');
  assert(getSeasonScore(Season.SPRING) === 30, 'Spring should score 30');
  assert(getSeasonScore(Season.SUMMER) === 20, 'Summer should score 20');
  
  console.log('✓ Season scoring tests passed');
}

// Test overall rating calculation
function testRatingCalculation(): void {
  console.log('Testing overall rating calculation...');
  
  // Test minimum rating scenario
  const regularLocation: Location = { ...testLocation, type: LocationType.REGULAR };
  const normalEnvironmental: EnvironmentalFactors = {
    weather: {
      condition: WeatherCondition.CLEAR,
      temperature: 25,
      visibility: 15000,
      precipitation: false,
      humidity: 40,
      windSpeed: 3
    },
    time: {
      hour: 12,
      isNighttime: false,
      timezone: 'UTC',
      localTime: '12:00 PM'
    },
    season: Season.SUMMER
  };
  
  const minRating = calculateHauntedRating(regularLocation, normalEnvironmental);
  assert(minRating.overallScore === 17, 'Minimum rating should be 17'); // (10*0.4) + (10*0.25) + (10*0.25) + (20*0.1) = 17
  
  // Test high rating scenario
  const castleLocation: Location = { ...testLocation, type: LocationType.CASTLE };
  const spookyEnvironmental: EnvironmentalFactors = {
    weather: {
      condition: WeatherCondition.FOGGY,
      temperature: 5,
      visibility: 500,
      precipitation: true,
      humidity: 90,
      windSpeed: 15
    },
    time: {
      hour: 1, // 1 AM
      isNighttime: true,
      timezone: 'UTC',
      localTime: '1:00 AM'
    },
    season: Season.AUTUMN
  };
  
  const highRating = calculateHauntedRating(castleLocation, spookyEnvironmental);
  assert(highRating.overallScore > 80, 'High spookiness scenario should score above 80');
  assert(highRating.overallScore <= 100, 'Rating should not exceed 100');
  
  // Verify structure
  assert(typeof highRating.overallScore === 'number', 'Overall score should be a number');
  assert(typeof highRating.factors === 'object', 'Factors should be an object');
  assert(highRating.calculatedAt instanceof Date, 'CalculatedAt should be a Date');
  
  console.log('✓ Rating calculation tests passed');
}

// Test rating with breakdown
function testRatingWithBreakdown(): void {
  console.log('Testing rating with breakdown...');
  
  const location: Location = { ...testLocation, type: LocationType.GRAVEYARD };
  const rating = calculateHauntedRatingWithBreakdown(location, baseEnvironmental);
  
  assert(Array.isArray(rating.breakdown), 'Breakdown should be an array');
  assert(rating.breakdown.length === 4, 'Breakdown should have 4 factors');
  
  const factors = ['Location Type', 'Weather Conditions', 'Time of Day', 'Season'];
  rating.breakdown.forEach((item, index) => {
    assert(item.factor === factors[index], `Factor ${index} should be ${factors[index]}`);
    assert(typeof item.weight === 'number', 'Weight should be a number');
    assert(typeof item.contribution === 'number', 'Contribution should be a number');
    assert(typeof item.description === 'string', 'Description should be a string');
    assert(item.description.length > 0, 'Description should not be empty');
  });
  
  console.log('✓ Rating with breakdown tests passed');
}

// Test rating explanations
function testRatingExplanations(): void {
  console.log('Testing rating explanations...');
  
  assert(getRatingExplanation(95).includes('Extremely haunted'), 'Score 95 should be extremely haunted');
  assert(getRatingExplanation(80).includes('Highly haunted'), 'Score 80 should be highly haunted');
  assert(getRatingExplanation(65).includes('Moderately haunted'), 'Score 65 should be moderately haunted');
  assert(getRatingExplanation(45).includes('Mildly haunted'), 'Score 45 should be mildly haunted');
  assert(getRatingExplanation(30).includes('Low paranormal activity'), 'Score 30 should be low paranormal activity');
  assert(getRatingExplanation(15).includes('Minimal haunting'), 'Score 15 should be minimal haunting');
  
  console.log('✓ Rating explanation tests passed');
}

// Test edge cases
function testEdgeCases(): void {
  console.log('Testing edge cases...');
  
  // Test boundary conditions for time scoring
  assert(getTimeScore({ hour: 2, isNighttime: true, timezone: 'UTC', localTime: '2:00 AM' }) === 100, 'Hour 2 should be witching hour');
  assert(getTimeScore({ hour: 3, isNighttime: true, timezone: 'UTC', localTime: '3:00 AM' }) === 70, 'Hour 3 should be early morning');
  
  // Test extreme weather conditions
  const extremeWeather = {
    condition: WeatherCondition.FOGGY,
    temperature: -50,
    visibility: 0,
    precipitation: true,
    humidity: 100,
    windSpeed: 50
  };
  
  const extremeScore = getWeatherScore(extremeWeather);
  assert(extremeScore <= 100, 'Extreme weather should not exceed 100');
  assert(extremeScore > 90, 'Extreme weather should score very high');
  
  // Test calculation consistency
  const location: Location = { ...testLocation, type: LocationType.CASTLE };
  const environmental: EnvironmentalFactors = {
    weather: {
      condition: WeatherCondition.RAINY,
      temperature: 10,
      visibility: 2000,
      precipitation: true,
      humidity: 85,
      windSpeed: 12
    },
    time: {
      hour: 23,
      isNighttime: true,
      timezone: 'UTC',
      localTime: '11:00 PM'
    },
    season: Season.WINTER
  };
  
  const rating1 = calculateHauntedRating(location, environmental);
  const rating2 = calculateHauntedRating(location, environmental);
  
  assert(rating1.overallScore === rating2.overallScore, 'Calculations should be consistent');
  
  console.log('✓ Edge case tests passed');
}

// Run all tests
function runAllTests(): void {
  console.log('🧪 Running haunted rating engine tests...\n');
  
  try {
    testLocationScoring();
    testWeatherScoring();
    testTimeScoring();
    testSeasonScoring();
    testRatingCalculation();
    testRatingWithBreakdown();
    testRatingExplanations();
    testEdgeCases();
    
    console.log('\n🎉 All tests passed! The haunted rating engine is working correctly.');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Export for potential use
export { runAllTests };

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runAllTests();
}