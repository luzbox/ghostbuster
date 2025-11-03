// Export specific functions to avoid conflicts
export { calculateHauntedRating } from './api';
export { getCurrentEnvironmentalFactors as getCurrentWeather } from './weatherService';
export { analyzeLocation, searchLocations as searchLocationByName } from './locationService';
export { getEnvironmentalFactors } from './environmentalService';
export { 
  getTimeUntilNextRefresh, 
  getActiveSession,
  startAutoRefresh,
  stopAutoRefresh 
} from './realTimeService';