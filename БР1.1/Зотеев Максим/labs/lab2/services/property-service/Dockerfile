FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/property-service/package.json ./services/property-service/

RUN npm install --workspaces --include-workspace-root

COPY packages/shared ./packages/shared
COPY services/property-service ./services/property-service

RUN npm run build -w @rental/shared
RUN npm run build -w property-service

WORKDIR /app/services/property-service
EXPOSE 3002

CMD ["node", "dist/index.js"]
