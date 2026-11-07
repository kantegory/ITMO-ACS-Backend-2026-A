FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
COPY docs ./docs

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start"]
