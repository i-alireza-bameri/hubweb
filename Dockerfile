# Multi-stage production build for OmniSpace Full-Stack Application
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Runner
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=frontend-builder /app/dist ./dist
COPY server.ts ./
COPY tsconfig.json ./
RUN npm install -g tsx

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["tsx", "server.ts"]
