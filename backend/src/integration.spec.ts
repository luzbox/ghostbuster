/**
 * Integration tests for API services
 * Tests real API responses and error scenarios with mocked external dependencies
 */

import { config } from './config/index.js';
import { analyzeLocation, searchLocationByName } from './services/locationService.js';
import { getCurrentWeather } from './services/weatherService.js';
import { getEnvironmentalFactors } from './services/environmentalService.js';
import { calculateHauntedRating } from './services/ratingService.js';
import { LocationType, WeatherCondition, Season, type Coordinates } from './types/index.js';

// Mock axios to control external API responses
import axios from 'axios';

// Test data
const testCoordinates: Coordinates = { latitude: 40.7128, longitude: -74.0060 }; // NYC
const invalidCoordinates: Coordinates = { latitude: 200, longitude: -200 };

// Mock responses for external APIs
const mockWeatherResponse = {
  weather: [{ main: 'Fog', description: 'fog' }],
  main: { temp: 5, humidity: 90 },
  visibility: 500,
  wind: { speed: 10 },
  rain: { '1h': 2.5 }
};

const mockPlacesResponse = {
  status: 'OK',
  results: [
    {
      name: 'Test Castle',
      types: ['castle', 'tourist_attraction'],
      geometry: { location: { lat: 40.7128, lng: -74.0060 } }
    },
    {
      name: 'Old Cemetery',
      types: ['cemetery', 'establishment'],
      geometry: { location: { lat: 40.7130, lng: -74.0062 } }
    }
  ]
};

const mockGeocodingResponse = {
  features: [
    {
      text: 'Test Castle',
      place_name: 'Test Castle, New York, NY, USA',
      center: [-74.0060, 40.7128]
    }
  ]
};

// Simple assertion function
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Integration test failed: ${message}`);
  }
}

// Mock axios for controlled testing
function mockAxiosGet(url: string, config?: any): Promise<any> {
  if (url.includes('openweathermap.org')) {
    return Promise.resolve({ data: mockWeatherResponse });
  } else if (url.includes('googleapis.com/maps/api/place')) {
    return Promise.resolve({ data: mockPlacesResponse });
  } else if (url.includes('api.mapbox.com/geocoding')) {
    return Promise.resolve({ data: mockGeocodingResponse });
  }
  return Promise.reject(new Error('Unmocked API call'));
}

// Test weather service integration
async function testWeatherServiceIntegration(): Promise<void> {
  console.log('Testing weather service integration...');
  
  // Mock successful API response
  const originalGet = axios.get;
  axios.get = mockAxiosGet as any;
  
  try {
    const weather = await getCurrentWeather(testCoordinates);
    
    assert(typeof weather.condition === 'string', 'Weather condition should be a string');
    assert(typeof weather.temperature === 'number', 'Temperature should be a number');
    assert(typeof weather.visibility === 'number', 'Visibility should be a number');
    assert(typeof weather.precipitation === 'boolean', 'Precipitation should be a boolean');
    assert(weather.condition === WeatherCondition.FOGGY, 'Should map fog to FOGGY condition');
    assert(weather.temperature === 5, 'Should return correct temperature');
    assert(weather.precipitation === true, 'Should detect precipitation from rain data');
    
    console.log('✓ Weather service integration tests passed');
  } finally {
    axios.get = originalGet;
  }
}

// Test weather service error handling
async function testWeatherServiceErrorHandling(): Promise<void> {
  console.log('Testing weather service error handling...');
  
  const originalGet = axios.get;
  
  // Test API error response
  axios.get = () => Promise.reject({
    response: { status: 401, data: { message: 'Invalid API key' } }
  });
  
  try {
    await getCurrentWeather(testCoordinates);
    assert(false, 'Should have thrown an error for 401 response');
  } catch (error: any) {
    assert(error.message.includes('Invalid OpenWeatherMap API key'), 'Should handle 401 errors correctly');
  }
  
  // Test timeout error
  axios.get = () => Promise.reject({ code: 'ECONNABORTED' });
  
  try {
    await getCurrentWeather(testCoordinates);
    assert(false, 'Should have thrown an error for timeout');
  } catch (error: any) {
    assert(error.message.includes('timeout'), 'Should handle timeout errors correctly');
  }
  
  // Test rate limit error
  axios.get = () => Promise.reject({
    response: { status: 429, data: { message: 'Rate limit exceeded' } }
  });
  
  try {
    await getCurrentWeather(testCoordinates);
    assert(false, 'Should have thrown an error for rate limit');
  } catch (error: any) {
    assert(error.message.includes('rate limit'), 'Should handle rate limit errors correctly');
  }
  
  axios.get = originalGet;
  console.log('✓ Weather service error handling tests passed');
}

// Test location service integration
async function testLocationServiceIntegration(): Promise<void> {
  console.log('Testing location service integration...');
  
  const originalGet = axios.get;
  axios.get = mockAxiosGet as any;
  
  try {
    const location = await analyzeLocation(testCoordinates, 'Test Castle');
    
    assert(typeof location.coordinates === 'object', 'Location should have coordinates');
    assert(location.coordinates.latitude === testCoordinates.latitude, 'Should preserve latitude');
    assert(location.coordinates.longitude === testCoordinates.longitude, 'Should preserve longitude');
    assert(typeof location.name === 'string', 'Location should have a name');
    assert(Object.values(LocationType).includes(location.type), 'Should have valid location type');
    assert(Array.isArray(location.nearbyPOIs), 'Should have nearbyPOIs array');
    assert(typeof location.address === 'string', 'Should have address string');
    
    // Should detect castle from mock data
    assert(location.type === LocationType.CASTLE, 'Should detect castle from POI data');
    
    console.log('✓ Location service integration tests passed');
  } finally {
    axios.get = originalGet;
  }
}

// Test location service with API failures
async function testLocationServiceFallback(): Promise<void> {
  console.log('Testing location service fallback behavior...');
  
  const originalGet = axios.get;
  
  // Mock all external APIs to fail
  axios.get = () => Promise.reject(new Error('API unavailable'));
  
  try {
    const location = await analyzeLocation(testCoordinates, 'Test Location');
    
    // Should return basic location even when APIs fail
    assert(location.type === LocationType.REGULAR, 'Should default to REGULAR type when APIs fail');
    assert(location.nearbyPOIs.length === 0, 'Should have empty POIs array when APIs fail');
    assert(location.name === 'Test Location', 'Should use provided name when geocoding fails');
    
    console.log('✓ Location service fallback tests passed');
  } finally {
    axios.get = originalGet;
  }
}

// Test location search integration
async function testLocationSearchIntegration(): Promise<void> {
  console.log('Testing location search integration...');
  
  const originalGet = axios.get;
  axios.get = mockAxiosGet as any;
  
  try {
    const locations = await searchLocationByName('Test Castle');
    
    assert(Array.isArray(locations), 'Should return array of locations');
    assert(locations.length > 0, 'Should find at least one location');
    
    const firstLocation = locations[0];
    assert(typeof firstLocation.name === 'string', 'Location should have name');
    assert(typeof firstLocation.coordinates === 'object', 'Location should have coordinates');
    assert(Object.values(LocationType).includes(firstLocation.type), 'Should have valid location type');
    
    console.log('✓ Location search integration tests passed');
  } finally {
    axios.get = originalGet;
  }
}

// Test environmental factors integration
async function testEnvironmentalFactorsIntegration(): Promise<void> {
  console.log('Testing environmental factors integration...');
  
  const originalGet = axios.get;
  axios.get = mockAxiosGet as any;
  
  try {
    const environmental = await getEnvironmentalFactors(testCoordinates);
    
    // Validate weather data
    assert(typeof environmental.weather === 'object', 'Should have weather object');
    assert(Object.values(WeatherCondition).includes(environmental.weather.condition), 'Should have valid weather condition');
    assert(typeof environmental.weather.temperature === 'number', 'Should have temperature');
    
    // Validate time data
    assert(typeof environmental.time === 'object', 'Should have time object');
    assert(typeof environmental.time.hour === 'number', 'Should have hour');
    assert(environmental.time.hour >= 0 && environmental.time.hour <= 23, 'Hour should be valid');
    assert(typeof environmental.time.isNighttime === 'boolean', 'Should have nighttime flag');
    assert(typeof environmental.time.timezone === 'string', 'Should have timezone');
    
    // Validate season
    assert(Object.values(Season).includes(environmental.season), 'Should have valid season');
    
    console.log('✓ Environmental factors integration tests passed');
  } finally {
    axios.get = originalGet;
  }
}

// Test complete rating calculation integration
async function testRatingCalculationIntegration(): Promise<void> {
  console.log('Testing complete rating calculation integration...');
  
  const originalGet = axios.get;
  axios.get = mockAxiosGet as any;
  
  try {
    // Get all required data
    const location = await analyzeLocation(testCoordinates, 'Spooky Castle');
    const environmental = await getEnvironmentalFactors(testCoordinates);
    
    // Calculate rating
    const rating = calculateHauntedRating(location, environmental);
    
    // Validate rating structure
    assert(typeof rating.overallScore === 'number', 'Should have overall score');
    assert(rating.overallScore >= 0 && rating.overallScore <= 100, 'Score should be between 0-100');
    
    assert(typeof rating.factors === 'object', 'Should have factors object');
    assert(typeof rating.factors.locationScore === 'number', 'Should have location score');
    assert(typeof rating.factors.weatherScore === 'number', 'Should have weather score');
    assert(typeof rating.factors.timeScore === 'number', 'Should have time score');
    assert(typeof rating.factors.seasonScore === 'number', 'Should have season score');
    
    assert(Array.isArray(rating.breakdown), 'Should have breakdown array');
    assert(rating.breakdown.length === 4, 'Should have 4 breakdown items');
    
    assert(rating.calculatedAt instanceof Date, 'Should have calculation timestamp');
    
    // Verify high rating for spooky conditions
    assert(rating.overallScore > 50, 'Spooky castle with fog should have high rating');
    
    console.log('✓ Rating calculation integration tests passed');
  } finally {
    axios.get = originalGet;
  }
}

// Test caching behavior
async function testCachingBehavior(): Promise<void> {
  console.log('Testing caching behavior...');
  
  const originalGet = axios.get;
  let apiCallCount = 0;
  
  axios.get = (url: string, config?: any) => {
    apiCallCount++;
    return mockAxiosGet(url, config);
  };
  
  try {
    // First call should hit API
    await getCurrentWeather(testCoordinates);
    const firstCallCount = apiCallCount;
    
    // Second call should use cache
    await getCurrentWeather(testCoordinates);
    const secondCallCount = apiCallCount;
    
    assert(secondCallCount === firstCallCount, 'Second call should use cache, not hit API again');
    
    console.log('✓ Caching behavior tests passed');
  } finally {
    axios.get = originalGet;
  }
}

// Test configuration validation
async function testConfigurationValidation(): Promise<void> {
  console.log('Testing configuration validation...');
  
  // Test with missing API keys
  const originalKeys = {
    openWeatherApiKey: config.openWeatherApiKey,
    googlePlacesApiKey: config.googlePlacesApiKey,
    mapboxAccessToken: config.mapboxAccessToken
  };
  
  try {
    // Test weather service without API key
    (config as any).openWeatherApiKey = '';
    
    try {
      await getCurrentWeather(testCoordinates);
      assert(false, 'Should throw error when API key is missing');
    } catch (error: any) {
      assert(error.message.includes('API key not configured'), 'Should handle missing API key');
    }
    
    // Test location search without API key
    (config as any).mapboxAccessToken = '';
    
    try {
      await searchLocationByName('test');
      assert(false, 'Should throw error when Mapbox token is missing');
    } catch (error: any) {
      assert(error.message.includes('access token not configured'), 'Should handle missing Mapbox token');
    }
    
    console.log('✓ Configuration validation tests passed');
  } finally {
    // Restore original configuration
    config.openWeatherApiKey = originalKeys.openWeatherApiKey;
    config.googlePlacesApiKey = originalKeys.googlePlacesApiKey;
    config.mapboxAccessToken = originalKeys.mapboxAccessToken;
  }
}

// Test input validation
async function testInputValidation(): Promise<void> {
  console.log('Testing input validation...');
  
  const originalGet = axios.get;
  axios.get = mockAxiosGet as any;
  
  try {
    // Test invalid coordinates
    try {
      await getCurrentWeather(invalidCoordinates);
      // Should still work but may return unexpected results
      console.log('  - Invalid coordinates handled gracefully');
    } catch (error) {
      console.log('  - Invalid coordinates rejected appropriately');
    }
    
    // Test empty location name
    const location = await analyzeLocation(testCoordinates, '');
    assert(location.name.length > 0, 'Should provide default name for empty input');
    
    // Test null/undefined inputs
    const location2 = await analyzeLocation(testCoordinates);
    assert(location2.name.length > 0, 'Should handle undefined location name');
    
    console.log('✓ Input validation tests passed');
  } finally {
    axios.get = originalGet;
  }
}

// Run all integration tests
async function runIntegrationTests(): Promise<void> {
  console.log('🧪 Running API services integration tests...\n');
  
  try {
    await testWeatherServiceIntegration();
    await testWeatherServiceErrorHandling();
    await testLocationServiceIntegration();
    await testLocationServiceFallback();
    await testLocationSearchIntegration();
    await testEnvironmentalFactorsIntegration();
    await testRatingCalculationIntegration();
    await testCachingBehavior();
    await testConfigurationValidation();
    await testInputValidation();
    
    console.log('\n🎉 All integration tests passed! API services are working correctly.');
    console.log('✅ External API integration validated');
    console.log('✅ Error handling scenarios tested');
    console.log('✅ Caching behavior verified');
    console.log('✅ Configuration validation confirmed');
    console.log('✅ Input validation working');
    
  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
    throw error;
  }
}

// Export for potential use
export { runIntegrationTests };

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runIntegrationTests().catch(console.error);
}