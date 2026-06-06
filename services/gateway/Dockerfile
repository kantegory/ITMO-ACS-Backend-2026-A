FROM node:20-alpine AS builder
WORKDIR /app
COPY services/gateway/package*.json ./
RUN npm ci
COPY services/gateway/ .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY services/gateway/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY api/openapi.yaml ./openapi/openapi.yaml
ENV OPENAPI_PATH=/app/openapi/openapi.yaml
EXPOSE 3000
CMD ["node", "dist/server.js"]
