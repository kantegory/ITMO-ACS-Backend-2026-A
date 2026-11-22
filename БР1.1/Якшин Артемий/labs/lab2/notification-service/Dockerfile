# syntax=docker/dockerfile:1
# notification-service — multi-stage сборка (ЛР4): компиляция в полном образе, запуск в slim.

# ── этап сборки: полный node-образ (есть toolchain для нативных модулей, напр. sqlite3) ──
FROM node:22-bookworm AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ── этап запуска: только dist + prod-зависимости, непривилегированный пользователь ──
FROM node:22-bookworm-slim
# версия релиза (SHA коммита) — видна в /health, по ней CI проверяет, что выкатился нужный релиз
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION \
    NODE_ENV=production \
    SERVICE_NAME=notification-service \
    PORT=8085
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
# каталог для файла SQLite (volume в compose); в k8s используется PostgreSQL
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 8085
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8085/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
