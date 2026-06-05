FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages ./packages
COPY services ./services

RUN npm ci --workspace=rent-messaging --include-workspace-root

WORKDIR /app/services/messaging
EXPOSE 3004
CMD ["npm", "run", "start"]
