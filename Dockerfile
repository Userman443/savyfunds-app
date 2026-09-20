# ---- Build stage: install all deps and compile frontend + backend ----
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json drizzle.config.ts ./
COPY migrations ./migrations
COPY public ./public
RUN npm ci
COPY --from=builder /app/dist ./dist
EXPOSE 5000
# Apply DB migrations, then start the app (API + static frontend on one port)
CMD ["sh", "-c", "npx drizzle-kit migrate && node dist/index.js"]
