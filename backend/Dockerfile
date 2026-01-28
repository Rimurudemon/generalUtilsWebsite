# Stage 1: Base
# Using node:20-slim for better-sqlite3 compatibility and Vite requirements
FROM node:20-slim AS base
WORKDIR /app

# Install build dependencies for better-sqlite3 native compilation
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for layer caching
COPY package*.json ./

# Install dependencies - this will compile better-sqlite3 for Linux
RUN npm install --build-from-source

# Stage 2: Development
# This stage is for local development with hot-reloading (via docker-compose volumes)
FROM base AS development
ENV NODE_ENV=development

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Note: In development, source files are mounted via docker-compose volumes
# so we don't copy them here. But we need a fallback copy for standalone use.
COPY . .

# We use 'npm run dev' which runs 'node server.js'
CMD ["npm", "run", "dev"]

# Stage 3: Production
# This stage creates a lean image for production deployment
FROM node:20-slim AS production
WORKDIR /app
ENV NODE_ENV=production

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production --build-from-source

COPY . .
CMD ["npm", "start"]
