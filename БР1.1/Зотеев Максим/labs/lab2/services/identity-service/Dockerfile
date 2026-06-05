FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/identity-service/package.json ./services/identity-service/

RUN npm install --workspaces --include-workspace-root

COPY packages/shared ./packages/shared
COPY services/identity-service ./services/identity-service

RUN npm run build -w @rental/shared
RUN npm run build -w identity-service

WORKDIR /app/services/identity-service
EXPOSE 3001

CMD ["node", "dist/index.js"]
