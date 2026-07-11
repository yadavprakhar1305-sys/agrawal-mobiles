FROM node:20-slim

WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

COPY backend/ ./backend/

# Copy built frontend
COPY frontend/build/ ./frontend/build/

# Expose port
ENV PORT=8080
EXPOSE 8080

WORKDIR /app/backend
CMD ["node", "server.js"]
