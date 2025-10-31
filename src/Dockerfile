# Multi-stage build: build TS with esbuild, then serve via nginx with HTTPS
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files first
COPY package.json package-lock.json* ./
RUN npm install

# Copy source files explicitly - ADD WEBSOCKET-SERVICE
COPY index.html .
COPY ai.ts main.ts router.ts state.ts utils.ts websocket-service.ts .
COPY views/ ./views/

# Build the application
RUN npx esbuild main.ts --bundle --minify --sourcemap --outfile=dist/app.js

FROM nginx:1.27-alpine

# Generate self-signed cert for dev HTTPS
RUN apk add --no-cache openssl \
 && mkdir -p /etc/ssl/private \
 && openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/ssl/private/self.key \
      -out /etc/ssl/certs/self.crt \
      -subj "/CN=localhost"

# Copy built assets
COPY --from=build /app/dist/app.js /usr/share/nginx/html/app.js
COPY --from=build /app/index.html /usr/share/nginx/html/index.html

# Use our nginx.conf with security headers + HTTPS redirect
COPY nginx.conf /etc/nginx/nginx.conf

# Remove the default Nginx vhost
RUN rm -f /etc/nginx/conf.d/default.conf || true

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
