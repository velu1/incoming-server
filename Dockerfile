# # Use Node.js base image
# FROM node:18

# # Set working directory
# WORKDIR /app

# # Copy dependency files
# COPY package*.json ./

# # Install all dependencies including dev dependencies
# RUN npm install

# # Copy all source code
# COPY . .

# # Expose port 8112 (matching the app configuration)
# EXPOSE 8112

# # Run the app directly using ts-node-dev
# CMD ["npm", "start"]


# ---- Stage 1: Build ----
FROM node:18 AS builder

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# ---- Stage 2: Run ----
FROM node:18-slim

# Create app directory
WORKDIR /app

# Copy only the build output and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --only=production

RUN apt-get update && apt-get install -y \
    libc6 \
    libstdc++6 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables if needed
ENV NODE_ENV=production

# Expose your app's port
EXPOSE 8112

# Start the app
CMD ["node", "dist/app.js"]
