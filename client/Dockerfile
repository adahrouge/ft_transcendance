FROM node:20-alpine

WORKDIR /app

# Copy pre-built dist directory (must be built locally with: npm run build)
COPY dist ./dist
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm install --production

# Expose port
EXPOSE 80

# Use Vite preview server to serve the dist directory
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "80"]
