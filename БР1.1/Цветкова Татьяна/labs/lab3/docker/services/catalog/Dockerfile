# Dockerfile для catalog-service. Контекст сборки — корень монорепо.

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++ \
    && ln -sf python3 /usr/bin/python

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY services/catalog/package.json services/catalog/

RUN npm install --workspaces --include-workspace-root --no-audit --no-fund

COPY tsconfig.base.json ./
COPY shared/ shared/
COPY services/catalog/ services/catalog/

ENV NODE_ENV=production
EXPOSE 3003

CMD sh -c "npm run seed -w services/catalog && npm run dev -w services/catalog"
