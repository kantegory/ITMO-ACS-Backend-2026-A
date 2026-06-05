FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/rental-service/package.json ./services/rental-service/

RUN npm install --workspaces --include-workspace-root

COPY packages/shared ./packages/shared
COPY services/rental-service ./services/rental-service

RUN npm run build -w @rental/shared
RUN npm run build -w rental-service

WORKDIR /app/services/rental-service
EXPOSE 3003

CMD ["node", "dist/index.js"]
