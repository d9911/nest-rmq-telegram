# Base stage for building the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy configuration and package files
COPY package.json yarn.lock tsconfig.json nest-cli.json ./

# Install development dependencies
RUN yarn install

# Copy source code
COPY src ./src

# Build the NestJS application
RUN yarn build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy production configuration and package files
COPY package.json yarn.lock tsconfig.json nest-cli.json ./

# Install only production dependencies
RUN yarn install --production

# Copy compiled application code from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the application port (if any, though notification uses RMQ)
EXPOSE 3000

# Run the compiled application in production mode
CMD ["node", "dist/main.js"]
