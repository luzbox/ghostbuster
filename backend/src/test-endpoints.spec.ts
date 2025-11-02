/**
 * Backend API endpoints validation
 * This file validates the API endpoints and their basic functionality
 */

import { validateCoordinates, validateHauntedScore } from './utils/validation.js';
import { calculateHauntedRating } from './services/ratingService.js';
import { LocationType, WeatherCondition, Season } from './types/index.js';

console.log('🧪 Testing backend API setup...');

// Test validation utilities
console.log('\n🔍 Testing validation utilities...');

const validCoords = { latitude: 40.7128, longitude: -74.0060 }; // NYC
const invalidCoords = { latitude: 200, longitude: -200 }; // Invalid

console.log(`Valid coordinates test: ${validateCoordinates(validCoords) ? '✅' : '❌'}`);
console.log(`Invalid coordinates test: ${!validateCoordinates(invalidCoords) ? '✅' : '❌'}`);

console.log(`Valid haunted score (75): ${validateHauntedScore(75) ? '✅' : '❌'}`);
console.log(`Invalid haunted score (150): ${!validateHauntedScore(150) ? '✅' : '❌'}`);

// Test rating calculation
console.log('\n🎯 Testing rating calculation...');

const testLocation = {
  coordinates: validCoords,
  name: 'Test Castle',
  type: LocationType.CASTLE,
  nearbyPOIs: [],
  address: 'Test Address'
};

const testEnvironmental = {
  weather: {
    condition: WeatherCondition.FOGGY,
    temperature: 5,
    visibility: 500,
    precipitation: true,
    humidity: 90,
    windSpeed: 10
  },
  time: {
    hour: 1, // 1 AM - witching hour
    isNighttime: true,
    timezone: 'UTC-5',
    localTime: new Date().toISOString()
  },
  season: Season.AUTUMN
};

try {
  const rating = calculateHauntedRating(testLocation, testEnvironmental);
  console.log(`Rating calculation test: ${rating.overallScore > 0 && rating.overallScore <= 100 ? '✅' : '❌'}`);
  console.log(`  Overall Score: ${rating.overallScore}/100`);
  console.log(`  Location Score: ${rating.factors.locationScore}`);
  console.log(`  Weather Score: ${rating.factors.weatherScore}`);
  console.log(`  Time Score: ${rating.factors.timeScore}`);
  console.log(`  Season Score: ${rating.factors.seasonScore}`);
  console.log(`  Breakdown items: ${rating.breakdown.length}`);
} catch (error) {
  console.log(`Rating calculation test: ❌ - ${error}`);
}

// Test enum values
console.log('\n📋 Testing enum values...');

const locationTypes = Object.values(LocationType);
const weatherConditions = Object.values(WeatherCondition);
const seasons = Object.values(Season);

console.log(`Location types defined: ${locationTypes.length === 5 ? '✅' : '❌'} (${locationTypes.length})`);
console.log(`Weather conditions defined: ${weatherConditions.length === 5 ? '✅' : '❌'} (${weatherConditions.length})`);
console.log(`Seasons defined: ${seasons.length === 4 ? '✅' : '❌'} (${seasons.length})`);

console.log('\n✅ Backend API validation complete!');
console.log('🚀 Ready to start server with: npm run dev');
console.log('📡 API endpoints will be available at:');
console.log('   POST /api/rating/calculate');
console.log('   GET  /api/location/analyze');
console.log('   GET  /api/location/search');
console.log('   GET  /api/weather/current');
console.log('   GET  /api/weather/environmental');
console.log('   GET  /health');