import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, logConfigStatus } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import ratingRoutes from './routes/rating.js';
import locationRoutes from './routes/location.js';
import weatherRoutes from './routes/weather.js';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openweathermap.org", "https://maps.googleapis.com", "https://api.mapbox.com"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Cache stats endpoint (development only)
if (config.nodeEnv === 'development') {
  app.get('/debug/cache', (req, res) => {
    const { getCacheStats } = require('./utils/cache.js');
    res.json({
      cacheStats: getCacheStats(),
      timestamp: new Date().toISOString()
    });
  });
}

// API routes
app.use('/api/rating', ratingRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/weather', weatherRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Ghostbuster API server running on port ${config.port}`);
  console.log(`📍 Health check: http://localhost:${config.port}/health`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  logConfigStatus();
});

export default app;