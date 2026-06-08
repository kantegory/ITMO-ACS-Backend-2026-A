FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY event-bus/package*.json ./event-bus/

RUN npm ci
RUN cd event-bus && npm ci

COPY . .
COPY event-bus ./event-bus

RUN cd event-bus && npm run build
RUN npm run build

EXPOSE 8001

CMD ["node", "dist/index.js"]