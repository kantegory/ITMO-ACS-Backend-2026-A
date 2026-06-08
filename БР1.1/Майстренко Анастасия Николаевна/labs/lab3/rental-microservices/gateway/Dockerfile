# Dockerfile API Gateway. Контекст сборки — корень проекта.
FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY tsconfig.json ./
COPY gateway ./gateway

EXPOSE 8000

CMD ["npx", "tsx", "gateway/app.ts"]
