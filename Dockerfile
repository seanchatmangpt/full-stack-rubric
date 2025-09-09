# Production Dockerfile - Pure JavaScript Nuxt 4 Application
FROM node:20-alpine AS base

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    dumb-init

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copy application source
COPY . .

# Build application (JavaScript only, no TypeScript)
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install system dependencies
RUN apk add --no-cache \
    curl \
    dumb-init

WORKDIR /app

# Copy package files and install production dependencies only
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy built application from build stage
COPY --from=base /app/.output ./.output
COPY --from=base /app/public ./public
COPY --from=base /app/nuxt.config.js ./nuxt.config.js

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nuxtjs -u 1001 -G nodejs

# Change ownership to nodejs user
RUN chown -R nuxtjs:nodejs /app
USER nuxtjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", ".output/server/index.mjs"]