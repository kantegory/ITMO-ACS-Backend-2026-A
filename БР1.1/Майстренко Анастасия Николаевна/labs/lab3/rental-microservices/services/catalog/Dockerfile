# Dockerfile сервиса Catalog. Контекст сборки — корень проекта.
FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY tsconfig.json ./
COPY shared ./shared
COPY services/catalog ./services/catalog

EXPOSE 8002

CMD ["npx", "tsx", "services/catalog/app.ts"]
