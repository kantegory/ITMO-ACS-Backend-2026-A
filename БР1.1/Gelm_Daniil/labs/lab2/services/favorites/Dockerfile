FROM node:22-alpine AS build
WORKDIR /app
COPY shared ./shared
COPY services/favorites/package*.json ./services/favorites/
RUN cd services/favorites && npm ci
COPY services/favorites ./services/favorites
WORKDIR /app/services/favorites
RUN npm run build

FROM node:22-alpine
WORKDIR /app/services/favorites
ENV NODE_ENV=production
COPY --from=build /app/services/favorites/dist ./dist
COPY --from=build /app/services/favorites/node_modules ./node_modules
COPY --from=build /app/services/favorites/package.json ./
EXPOSE 3007
CMD ["node", "dist/services/favorites/src/index.js"]
