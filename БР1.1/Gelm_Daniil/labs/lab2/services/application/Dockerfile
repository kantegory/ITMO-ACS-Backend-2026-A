FROM node:22-alpine AS build
WORKDIR /app
COPY shared ./shared
COPY services/application/package*.json ./services/application/
RUN cd services/application && npm ci
COPY services/application ./services/application
WORKDIR /app/services/application
RUN npm run build

FROM node:22-alpine
WORKDIR /app/services/application
ENV NODE_ENV=production
COPY --from=build /app/services/application/dist ./dist
COPY --from=build /app/services/application/node_modules ./node_modules
COPY --from=build /app/services/application/package.json ./
EXPOSE 3006
CMD ["node", "dist/services/application/src/index.js"]
