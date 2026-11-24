FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages ./packages
COPY services ./services

RUN npm ci --workspace=rent-gateway --include-workspace-root

WORKDIR /app/services/gateway
EXPOSE 3000
CMD ["npm", "run", "start"]
