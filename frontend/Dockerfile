# Build stage
FROM node:22-alpine AS builder

ARG API_BASE

ENV VITE_API_BASE_URL=${API_BASE}

WORKDIR /app

# Install dependencies (leverage layer caching)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# nginx runs as root by default in the official image, which is acceptable for this use case
# The official nginx:alpine image handles this properly

CMD ["nginx", "-g", "daemon off;"]