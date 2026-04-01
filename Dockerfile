FROM node:20-alpine

# Build the backend service from the repository root so CI can run
# `docker build .` successfully without needing a separate context.
WORKDIR /app/backend

# Copy dependency manifests first for better layer caching.
COPY backend/package*.json ./

# Install production dependencies only.
RUN npm install --omit=dev

# Copy the backend source into the image.
COPY backend/ ./

EXPOSE 5000

CMD ["node", "server.js"]
