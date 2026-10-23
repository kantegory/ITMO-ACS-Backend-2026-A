FROM node:22-slim
WORKDIR /app
# сначала только package.json: слой с зависимостями кешируется
COPY package.json package-lock.json ./
COPY packages/common/package.json packages/common/
COPY services/gateway/package.json services/gateway/
COPY services/identity/package.json services/identity/
COPY services/reference/package.json services/reference/
COPY services/vacancy/package.json services/vacancy/
COPY services/resume/package.json services/resume/
COPY services/application/package.json services/application/
COPY services/recommendation/package.json services/recommendation/
COPY services/notification/package.json services/notification/
# amqplib добавлен в package.json (ДЗ5); npm install актуализирует package-lock.json при сборке
RUN npm install
COPY . .
