import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler.js';
import { validateCoordinates } from '../utils/validation.js';

/**
 * Middleware to validate coordinate parameters in query string
 */
export const validateCoordinateParams = (req: Request, res: Response, next: NextFunction): void => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    throw createError('Latitude and longitude parameters are required', 400);
  }
  
  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lng as string);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    throw createError('Invalid latitude or longitude values', 400);
  }
  
  const coordinates = { latitude, longitude };
  
  if (!validateCoordinates(coordinates)) {
    throw createError('Coordinates are out of valid range', 400);
  }
  
  // Add parsed coordinates to request object
  (req as any).coordinates = coordinates;
  
  next();
};

/**
 * Middleware to validate JSON request body
 */
export const validateJsonBody = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === 'POST' || req.method === 'PUT') {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw createError('Request body is required', 400);
    }
  }
  
  next();
};

/**
 * Middleware to validate search query parameter
 */
export const validateSearchQuery = (req: Request, res: Response, next: NextFunction): void => {
  const { q: query } = req.query;
  
  if (!query || typeof query !== 'string') {
    throw createError('Search query parameter "q" is required', 400);
  }
  
  const trimmedQuery = query.trim();
  
  if (trimmedQuery.length < 2) {
    throw createError('Search query must be at least 2 characters long', 400);
  }
  
  if (trimmedQuery.length > 100) {
    throw createError('Search query must be less than 100 characters', 400);
  }
  
  // Add sanitized query to request
  (req as any).searchQuery = trimmedQuery;
  
  next();
};

/**
 * Middleware to validate timestamp parameter
 */
export const validateTimestamp = (req: Request, res: Response, next: NextFunction): void => {
  const { timestamp } = req.query;
  
  if (timestamp && typeof timestamp === 'string') {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      throw createError('Invalid timestamp format. Use ISO 8601 format.', 400);
    }
    
    // Check if timestamp is not too far in the future (max 1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    if (date > oneYearFromNow) {
      throw createError('Timestamp cannot be more than 1 year in the future', 400);
    }
    
    // Add parsed timestamp to request
    (req as any).timestamp = timestamp;
  }
  
  next();
};