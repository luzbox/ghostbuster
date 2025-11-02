# Multi-stage build for production
FROM node:18-alpine AS frontend-build

# Build frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Backend stage
FROM node:18-alpine AS backend-build

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy backend
COPY --from=backend-build /app/backend ./backend
COPY --from=frontend-build /app/dist ./dist

# Install serve to serve static files
RUN npm install -g serve

# Create startup script
RUN echo '#!/bin/sh' > start.sh && \
    echo 'serve -s dist -l 3000 &' >> start.sh && \
    echo 'cd backend && node simple-server.js &' >> start.sh && \
    echo 'wait' >> start.sh && \
    chmod +x start.sh

EXPOSE 3000 3001

CMD ["./start.sh"]