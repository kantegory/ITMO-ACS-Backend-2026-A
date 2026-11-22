
FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci


COPY tsconfig.json ./
COPY src ./src
RUN npm run build

CMD ["node", "dist/app.js"]