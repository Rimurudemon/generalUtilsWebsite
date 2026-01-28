# Stage 1: Base
# Using node:18-slim instead of alpine for better-sqlite3 compatibility
FROM node:18-slim AS base
WORKDIR /app

# Install build dependencies for better-sqlite3 native compilation
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# Install dependencies including 'devDependencies' for development flexibility
RUN npm install

# Stage 2: Development
# This stage is for local development with hot-reloading (via docker-compose volumes)
FROM base AS development
ENV NODE_ENV=development

# Create data directory for SQLite database
RUN mkdir -p /app/data

COPY . .
# We use 'npm run dev' which runs 'node server.js'
# Volume mounts in docker-compose will override the './' copy, enabling live edits.
CMD ["npm", "run", "dev"]

# Stage 3: Production
# This stage creates a lean image for production deployment
FROM base AS production
ENV NODE_ENV=production

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Re-install only production dependencies to keep image small
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
