FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages ./packages
COPY services ./services

RUN npm ci --workspace=rent-auth --include-workspace-root

WORKDIR /app/services/auth
EXPOSE 3001
CMD ["npm", "run", "start"]
