# 🚀 Deployment Guide

## Pre-Deployment Checklist

- [ ] All tests passing (`npm run test:run`)
- [ ] Build works locally (`npm run build`)
- [ ] Environment variables configured
- [ ] API keys obtained (if needed):
  - [ ] Mapbox Access Token
  - [ ] OpenWeather API Key (optional)
  - [ ] Google Places API Key (optional)

## Quick Deploy Options

### 🟢 Easiest: Vercel
1. Push to GitHub
2. Connect repository at [vercel.com](https://vercel.com)
3. Auto-deploys on every push!

### 🟡 Alternative: Netlify
1. Push to GitHub  
2. Connect repository at [netlify.com](https://netlify.com)
3. Configure build settings (auto-detected)

### 🟠 Advanced: Railway
1. Push to GitHub
2. Connect at [railway.app](https://railway.app)
3. Supports both frontend and backend

### 🔴 Expert: Docker
```bash
docker build -t ghostbuster .
docker run -p 3000:3000 -p 3001:3001 ghostbuster
```

## Environment Variables

Set these in your deployment platform:

**Frontend:**
- `VITE_MAPBOX_ACCESS_TOKEN` - Your Mapbox token
- `VITE_API_BASE_URL` - Your API base URL

**Backend:**
- `OPENWEATHER_API_KEY` - OpenWeather API key
- `GOOGLE_PLACES_API_KEY` - Google Places API key
- `NODE_ENV=production`

## Post-Deployment

1. Test the live site
2. Check API endpoints work
3. Verify environment variables are loaded
4. Test on mobile devices

## Troubleshooting

**Build fails?**
- Check all dependencies are in `package.json`
- Ensure TypeScript compiles (`npm run build`)

**API not working?**
- Verify environment variables are set
- Check CORS settings
- Ensure API endpoints are accessible

**Maps not loading?**
- Verify Mapbox token is set correctly
- Check browser console for errors