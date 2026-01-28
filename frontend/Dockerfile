# Stage 1: Base
FROM node:18-alpine AS base
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

# Stage 4: Production
# Serves the static files using Nginx
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
