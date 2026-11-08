# ==============================================================================
# Anusandhan - Node.js Express Gateway (MERN Stack) Dockerfile
# ==============================================================================
FROM node:20-alpine AS base

WORKDIR /app

ENV NODE_ENV=production \
    PORT=5000

RUN apk add --no-cache curl

COPY package*.json ./

RUN npm ci --only=production

COPY . .

# Run as non-root node user
USER node

EXPOSE 5000

HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
