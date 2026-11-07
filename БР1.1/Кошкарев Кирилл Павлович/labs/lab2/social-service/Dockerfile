# ---------- этап сборки: ставим все зависимости и компилируем TypeScript ----------
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- этап выполнения: только production-зависимости и собранный код ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache wget

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# приложение работает от непривилегированного пользователя
USER node

EXPOSE 3000
CMD ["node", "dist/server.js"]
