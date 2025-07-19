# Multi-stage build for SBR CAD System
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force
RUN cd client && npm ci --only=production && npm cache clean --force

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install all dependencies (including dev dependencies)
RUN npm ci
RUN cd client && npm ci

# Copy source code
COPY . .

# Build backend
RUN npm run build:server

# Build frontend
RUN cd client && npm run build

# Frontend development stage
FROM node:18-alpine AS frontend

WORKDIR /app

# Copy package files
COPY client/package*.json ./client/

# Install frontend dependencies
RUN cd client && npm ci

# Copy frontend source code
COPY client/ ./client/

# Expose port
EXPOSE 3001

# Start frontend development server
CMD ["cd", "client", "&&", "npm", "start"]

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/client/build ./client/build
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Create necessary directories
RUN mkdir -p logs reports && chown -R nodejs:nodejs logs reports

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server/index.js"] 