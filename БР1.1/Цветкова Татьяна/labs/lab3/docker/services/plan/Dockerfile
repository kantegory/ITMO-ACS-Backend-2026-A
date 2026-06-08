# Dockerfile для plan-service. Контекст сборки — корень монорепо.

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++ \
    && ln -sf python3 /usr/bin/python

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY services/plan/package.json services/plan/

RUN npm install --workspaces --include-workspace-root --no-audit --no-fund

COPY tsconfig.base.json ./
COPY shared/ shared/
COPY services/plan/ services/plan/

ENV NODE_ENV=production
EXPOSE 3004

CMD ["npm", "run", "dev", "-w", "services/plan"]
