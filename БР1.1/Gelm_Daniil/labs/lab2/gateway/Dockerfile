FROM node:22-alpine AS build
WORKDIR /app
COPY shared ./shared
COPY gateway/package*.json ./gateway/
RUN cd gateway && npm ci
COPY gateway ./gateway
WORKDIR /app/gateway
RUN npm run build

FROM node:22-alpine
WORKDIR /app/gateway
ENV NODE_ENV=production
COPY --from=build /app/gateway/dist ./dist
COPY --from=build /app/gateway/node_modules ./node_modules
COPY --from=build /app/gateway/package.json ./
EXPOSE 3000
CMD ["node", "dist/gateway/src/index.js"]
