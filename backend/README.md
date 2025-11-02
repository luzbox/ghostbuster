# Ghostbuster Backend API

Express.js backend server for the Ghostbuster webapp with TypeScript, CORS, rate limiting, and security middleware.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment configuration:
```bash
cp .env.example .env
```

3. Configure your API keys in `.env`:
   - `OPENWEATHER_API_KEY`: Get from https://openweathermap.org/api
   - `GOOGLE_PLACES_API_KEY`: Get from Google Cloud Console
   - `MAPBOX_ACCESS_TOKEN`: Get from https://mapbox.com

## Development

Start the development server:
```bash
npm run dev
```

The server will run on http://localhost:3001

## Production

Build and start:
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Rating (To be implemented in subtask 8.2)
- `POST /api/rating/calculate` - Calculate haunted rating for a location

### Location (To be implemented in subtask 8.3)
- `GET /api/location/analyze` - Analyze location type and nearby POIs

### Weather (To be implemented in subtask 8.3)
- `GET /api/weather/current` - Get current weather conditions

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Request Validation**: Input sanitization
- **Error Handling**: Comprehensive error middleware

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key | - |
| `GOOGLE_PLACES_API_KEY` | Google Places API key | - |
| `MAPBOX_ACCESS_TOKEN` | Mapbox access token | - |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |