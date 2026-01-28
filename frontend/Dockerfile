# Stage 1: Base
# Using node:20-alpine for Vite compatibility (requires Node.js 20.19+)
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# Stage 2: Development
# We execute vite with --host to expose it to the container network
FROM base AS development
ENV NODE_ENV=development
COPY . .
CMD ["npm", "run", "dev", "--", "--host"]

# Stage 3: Builder
# Compiles the React application for production
FROM base AS builder
COPY . .
RUN npm run build

# Stage 4: Production (optional - serves static files with nginx)
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
