import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // CORS configuration
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // API Keys
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY || '',
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || '',
  mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN || '',
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  
  // Cache configuration
  cacheDefaultTtl: 300, // 5 minutes
  weatherCacheTtl: 1800, // 30 minutes
  locationCacheTtl: 3600, // 1 hour
  
  // External API URLs
  openWeatherBaseUrl: 'https://api.openweathermap.org/data/2.5',
  googlePlacesBaseUrl: 'https://maps.googleapis.com/maps/api/place',
  mapboxGeocodingBaseUrl: 'https://api.mapbox.com/geocoding/v5/mapbox.places'
};

/**
 * Validates that required environment variables are set
 */
export const validateConfig = (): { isValid: boolean; missingKeys: string[] } => {
  const requiredKeys = [
    'OPENWEATHER_API_KEY',
    'GOOGLE_PLACES_API_KEY', 
    'MAPBOX_ACCESS_TOKEN'
  ];
  
  const missingKeys = requiredKeys.filter(key => !process.env[key]);
  
  return {
    isValid: missingKeys.length === 0,
    missingKeys
  };
};

/**
 * Logs configuration status (without sensitive data)
 */
export const logConfigStatus = (): void => {
  const { isValid, missingKeys } = validateConfig();
  
  console.log('🔧 Configuration Status:');
  console.log(`   Port: ${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Frontend URL: ${config.frontendUrl}`);
  console.log(`   API Keys configured: ${isValid ? '✅' : '❌'}`);
  
  if (!isValid) {
    console.warn(`   Missing API keys: ${missingKeys.join(', ')}`);
    console.warn('   Some features may not work without proper API keys');
  }
};