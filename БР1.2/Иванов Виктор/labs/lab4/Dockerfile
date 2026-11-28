FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
RUN HTTP_PROXY="$HTTP_PROXY" HTTPS_PROXY="$HTTPS_PROXY" NO_PROXY="$NO_PROXY" npm install
COPY . .
EXPOSE 3000
CMD ["npx", "tsx", "services/gateway/src/index.ts"]
