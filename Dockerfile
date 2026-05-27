# Base stage for building
FROM node:20-alpine AS builder

WORKDIR /app

# Copy configuration and package files
COPY package.json yarn.lock tsconfig.json vite.config.ts ./

# Install all dependencies (development + production)
RUN yarn install

# Copy application source code
COPY src ./src
COPY index.html ./
COPY server.ts ./

# Build the frontend assets and compile the server
RUN yarn build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --production

# Copy compiled files and assets from builder
COPY --from=builder /app/dist ./dist

# Expose the application port
EXPOSE 3000

# Start the Express + Vite server in production mode
CMD ["node", "dist/server.cjs"]
