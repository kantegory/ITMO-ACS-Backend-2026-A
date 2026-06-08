# Dockerfile сервиса Identity. Контекст сборки — корень проекта.
FROM node:20

WORKDIR /app

# Сначала зависимости (слой кэшируется и переиспользуется другими сервисами)
COPY package.json package-lock.json ./
RUN npm install

# Общий код и код конкретного сервиса
COPY tsconfig.json ./
COPY shared ./shared
COPY services/identity ./services/identity

EXPOSE 8001

CMD ["npx", "tsx", "services/identity/app.ts"]
