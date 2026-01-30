# Use Node.js 20 with Puppeteer support
FROM ghcr.io/puppeteer/puppeteer:22.0.0

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install server dependencies
RUN npm install --omit=dev

# Copy source code
COPY . .

# Build the client
WORKDIR /app/client
RUN npm install
RUN npm run build

# Go back to app root
WORKDIR /app

# Expose port (Railway will set PORT env var)
EXPOSE 3001

# Start the server
CMD ["node", "server/index.js"]
