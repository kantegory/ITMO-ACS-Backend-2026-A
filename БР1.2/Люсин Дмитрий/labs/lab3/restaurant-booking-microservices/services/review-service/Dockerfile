FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update     && apt-get install -y --no-install-recommends python3 make g++     && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

RUN mkdir -p /app/data
COPY services/review-service ./services/review-service


EXPOSE 3006

CMD ["node", "services/review-service/src/server.js"]
