/**
 * Basic server setup validation
 * This file validates the server configuration and setup
 */

import { config, validateConfig } from './config/index.js';
import { validateCoordinates, validateHauntedScore } from './utils/validation.js';

// Test configuration validation
console.log('🧪 Testing server configuration...');

const configValidation = validateConfig();
console.log(`Configuration valid: ${configValidation.isValid}`);
if (!configValidation.isValid) {
  console.log(`Missing keys: ${configValidation.missingKeys.join(', ')}`);
}

// Test validation utilities
console.log('\n🧪 Testing validation utilities...');

// Test coordinate validation
const validCoords = { latitude: 40.7128, longitude: -74.0060 }; // NYC
const invalidCoords = { latitude: 200, longitude: -200 }; // Invalid

console.log(`Valid coordinates test: ${validateCoordinates(validCoords) ? '✅' : '❌'}`);
console.log(`Invalid coordinates test: ${!validateCoordinates(invalidCoords) ? '✅' : '❌'}`);

// Test haunted score validation
console.log(`Valid score (50): ${validateHauntedScore(50) ? '✅' : '❌'}`);
console.log(`Invalid score (150): ${!validateHauntedScore(150) ? '✅' : '❌'}`);
console.log(`Invalid score (NaN): ${!validateHauntedScore(NaN) ? '✅' : '❌'}`);

// Test configuration values
console.log('\n🧪 Testing configuration values...');
console.log(`Port is number: ${typeof config.port === 'number' ? '✅' : '❌'}`);
console.log(`Rate limit window is number: ${typeof config.rateLimitWindowMs === 'number' ? '✅' : '❌'}`);
console.log(`Frontend URL is string: ${typeof config.frontendUrl === 'string' ? '✅' : '❌'}`);

console.log('\n✅ Server setup validation complete!');
console.log('Ready to implement API endpoints in subtasks 8.2 and 8.3');