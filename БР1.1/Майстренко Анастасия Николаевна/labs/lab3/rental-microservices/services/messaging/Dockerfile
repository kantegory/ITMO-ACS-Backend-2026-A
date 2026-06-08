# Dockerfile сервиса Messaging. Контекст сборки — корень проекта.
FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY tsconfig.json ./
COPY shared ./shared
COPY services/messaging ./services/messaging

EXPOSE 8004

CMD ["npx", "tsx", "services/messaging/app.ts"]
