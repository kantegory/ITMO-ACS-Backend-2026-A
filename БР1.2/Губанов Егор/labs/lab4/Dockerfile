FROM node:22-alpine
WORKDIR /app
COPY lab2/package.json lab2/package-lock.json ./
COPY lab2/services ./services
COPY lab2/packages ./packages
RUN npm ci --no-audit --no-fund && npm cache clean --force
USER node
WORKDIR /app/services/gateway
CMD ["npm", "run", "start"]
