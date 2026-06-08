# Dockerfile сервиса Booking. Контекст сборки — корень проекта.
FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY tsconfig.json ./
COPY shared ./shared
COPY services/booking ./services/booking

EXPOSE 8003

CMD ["npx", "tsx", "services/booking/app.ts"]
