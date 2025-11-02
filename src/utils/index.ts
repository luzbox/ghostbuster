// Utility functions for the Ghostbuster webapp

/**
 * Format coordinates for display
 */
export const formatCoordinates = (lat: number, lng: number): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Format haunted rating for display
 */
export const formatHauntedRating = (rating: number): string => {
  if (rating >= 90) return 'Extremely Haunted';
  if (rating >= 70) return 'Very Haunted';
  if (rating >= 50) return 'Moderately Haunted';
  if (rating >= 30) return 'Slightly Haunted';
  return 'Not Haunted';
};

/**
 * Get rating color based on score
 */
export const getRatingColor = (rating: number): string => {
  if (rating >= 90) return 'text-red-400';
  if (rating >= 70) return 'text-orange-400';
  if (rating >= 50) return 'text-yellow-400';
  if (rating >= 30) return 'text-blue-400';
  return 'text-green-400';
};

/**
 * Validate coordinates
 */
export const isValidCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Export rating engine functions
export {
  calculateHauntedRating,
  calculateHauntedRatingWithBreakdown,
  generateFactorBreakdown,
  getRatingExplanation,
  getLocationScore,
  getWeatherScore,
  getTimeScore,
  getSeasonScore
} from './ratingEngine.js';

// Export performance utilities
export * from './performance';

// Export error handling utilities
export * from './errorHandling';