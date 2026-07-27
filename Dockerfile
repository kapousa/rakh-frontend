# --- Stage 1: Build Stage ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy all source code
COPY . .

# Build the Vite app for production (outputs to /app/dist)
RUN npm run build

# --- Stage 2: Serve Stage ---
FROM nginx:alpine

# Copy custom Nginx config for Client-Side Routing (SPA)
COPY --from=builder /app/dist /usr/share/nginx/html

# Create default Nginx config to handle React Router / single-page apps
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80 for Easypanel
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]