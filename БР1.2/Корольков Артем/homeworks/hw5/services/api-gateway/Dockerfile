FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY services ./services
COPY docs/openapi.yaml ./docs/openapi.yaml
COPY tsconfig.json ./

ENV PORT=3010
EXPOSE 3010
CMD ["npm", "run", "start:gateway"]
