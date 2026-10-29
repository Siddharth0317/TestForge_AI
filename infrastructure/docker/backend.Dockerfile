FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace and backend manifests
COPY package.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm install --workspace=backend

COPY backend/ ./backend/
WORKDIR /app/backend
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY backend/package.json ./backend/
RUN npm install --omit=dev --workspace=backend

COPY --from=builder /app/backend/dist ./backend/dist

EXPOSE 4000
CMD ["node", "backend/dist/server.js"]

