# VibePay Dockerfile for Railway/Container Deployment
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs data

# Set proper permissions
RUN chown -R node:node /app
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-3000}/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Expose port
EXPOSE ${PORT:-3000}

# Start the application
CMD ["npm", "start"]

# Labels for Railway
LABEL org.opencontainers.image.title="VibePay"
LABEL org.opencontainers.image.description="Universal payment processing connector API"
LABEL org.opencontainers.image.source="https://github.com/TethralAI/vpio"
LABEL org.opencontainers.image.version="1.0.0"