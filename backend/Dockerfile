# Multi-stage Dockerfile for production deployment
FROM node:18-alpine AS base
LABEL org.opencontainers.image.source="https://github.com/sbtcpay/sbtc-payment-gateway"
LABEL org.opencontainers.image.description="sBTC Payment Gateway - Production API Server"
LABEL maintainer="sBTC Payment Gateway Team <team@sbtcpay.com>"

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    tzdata \
    tini \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodeuser -u 1001

# Set timezone
ENV TZ=UTC

# Development stage
FROM base AS development
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install all dependencies (including dev dependencies)
RUN npm ci --include=dev

# Copy source code
COPY backend/ ./backend/
COPY docs/ ./docs/

# Set development environment
ENV NODE_ENV=development
ENV LOG_LEVEL=debug

# Expose port
EXPOSE 3001

# Use tini as init system
ENTRYPOINT ["tini", "--"]

# Start development server with nodemon
CMD ["npm", "run", "dev", "--workspace=backend"]

# Build stage
FROM base AS build
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies (production only)
RUN npm ci --only=production --workspace=backend

# Copy source code
COPY backend/ ./backend/

# Remove unnecessary files
RUN rm -rf ./backend/tests \
    ./backend/coverage \
    ./backend/logs \
    ./backend/docs \
    ./backend/.env.example \
    ./backend/README.md

# Production stage
FROM base AS production
WORKDIR /app

# Copy built application from build stage
COPY --from=build --chown=nodeuser:nodejs /app/backend ./backend
COPY --from=build --chown=nodeuser:nodejs /app/node_modules ./node_modules

# Create logs directory
RUN mkdir -p /app/logs && chown nodeuser:nodejs /app/logs

# Set production environment variables
ENV NODE_ENV=production
ENV LOG_LEVEL=info
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node /app/backend/healthcheck.js || exit 1

# Security: Use non-root user
USER nodeuser

# Expose port
EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start production server
CMD ["node", "/app/backend/server.js"]

# Testing stage (for CI/CD)
FROM development AS testing
WORKDIR /app

# Copy test files
COPY backend/tests/ ./backend/tests/
COPY backend/jest.config.js ./backend/

# Set test environment
ENV NODE_ENV=test
ENV LOG_LEVEL=error

# Run tests
CMD ["npm", "test", "--workspace=backend"]