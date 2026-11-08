FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages ./packages
COPY services ./services

RUN npm ci --workspace=rent-catalog --include-workspace-root

WORKDIR /app/services/catalog
EXPOSE 3002
CMD ["npm", "run", "start"]
