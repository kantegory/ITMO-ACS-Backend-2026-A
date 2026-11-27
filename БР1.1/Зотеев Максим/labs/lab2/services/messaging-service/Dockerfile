FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/messaging-service/package.json ./services/messaging-service/

RUN npm install --workspaces --include-workspace-root

COPY packages/shared ./packages/shared
COPY services/messaging-service ./services/messaging-service

RUN npm run build -w @rental/shared
RUN npm run build -w messaging-service

WORKDIR /app/services/messaging-service
EXPOSE 3004

CMD ["node", "dist/index.js"]
