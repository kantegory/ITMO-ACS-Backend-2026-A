# Dockerfile для API Gateway. Контекст сборки — корень монорепо.

FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY gateway/package.json gateway/

RUN npm install --workspaces --include-workspace-root --no-audit --no-fund

COPY tsconfig.base.json ./
COPY shared/ shared/
COPY gateway/ gateway/

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "dev", "-w", "gateway"]
