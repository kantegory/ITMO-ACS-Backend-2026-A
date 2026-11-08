FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY services ./services
COPY tsconfig.json ./

ENV PORT=3001
EXPOSE 3001
CMD ["npm", "run", "start:auth"]
