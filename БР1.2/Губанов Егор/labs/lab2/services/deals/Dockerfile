FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages ./packages
COPY services ./services

RUN npm ci --workspace=rent-deals --include-workspace-root

WORKDIR /app/services/deals
EXPOSE 3003
CMD ["npm", "run", "start"]
