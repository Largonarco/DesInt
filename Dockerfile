# Use Node.js 20 with Puppeteer support
FROM ghcr.io/puppeteer/puppeteer:22.0.0

# Switch to root to set up directories
USER root

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Copy package files first (for better caching)
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Create directories and set permissions
RUN mkdir -p /app/client/node_modules /app/node_modules /app/data && \
    chown -R pptruser:pptruser /app

# Switch back to non-root user for security
USER pptruser

# Install root dependencies (without running postinstall)
RUN npm install --omit=dev --ignore-scripts

# Copy source code
COPY --chown=pptruser:pptruser . .

# Install client dependencies and build
WORKDIR /app/client
RUN npm install
RUN npm run build

# Go back to app root
WORKDIR /app

# Expose port (Railway will set PORT env var)
EXPOSE 3001

# Start the server
CMD ["node", "server/index.js"]
