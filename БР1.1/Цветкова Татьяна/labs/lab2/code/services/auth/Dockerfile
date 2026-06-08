# Dockerfile для auth-service
# Контекст сборки — корень монорепо (../../), потому что нужен shared-пакет
# и корневой package-lock.json npm workspaces.

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++ \
    && ln -sf python3 /usr/bin/python

# 1) Сначала только package.json-ы — для кэширования слоя зависимостей
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY services/auth/package.json services/auth/

# 2) Установка зависимостей для shared и auth (workspaces подтянет нужное)
RUN npm install --workspaces --include-workspace-root --no-audit --no-fund

# 3) Копируем исходники
COPY tsconfig.base.json ./
COPY shared/ shared/
COPY services/auth/ services/auth/

ENV NODE_ENV=production
EXPOSE 3001

# Перед стартом запускаем seed (идемпотентный — если данные уже есть, ничего не сделает),
# затем поднимаем сервис.
CMD sh -c "npm run seed -w services/auth && npm run dev -w services/auth"
