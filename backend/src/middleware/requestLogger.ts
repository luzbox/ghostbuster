import express from 'express';
import type { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log request
  console.log(`[REQUEST] ${timestamp} - ${req.method} ${req.path}`);
  
  // Log query parameters if present
  if (Object.keys(req.query).length > 0) {
    console.log(`[QUERY] ${JSON.stringify(req.query)}`);
  }
  
  // Log request body for POST/PUT requests (excluding sensitive data)
  if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields
    delete sanitizedBody.apiKey;
    delete sanitizedBody.token;
    console.log(`[BODY] ${JSON.stringify(sanitizedBody)}`);
  }

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - start;
    console.log(`[RESPONSE] ${timestamp} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    if (res.statusCode >= 400) {
      console.log(`[ERROR RESPONSE] ${JSON.stringify(body)}`);
    }
    
    return originalJson.call(this, body);
  };

  next();
};