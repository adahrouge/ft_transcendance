FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm install

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Expose ports
EXPOSE 80

# Use Vite preview server for production
# Runs on port 80 inside container, mapped to 8080 on host via docker-compose
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "80"]
