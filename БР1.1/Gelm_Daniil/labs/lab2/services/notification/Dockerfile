FROM node:22-alpine AS build
WORKDIR /app
COPY shared ./shared
COPY services/notification/package*.json ./services/notification/
RUN cd services/notification && npm ci
COPY services/notification ./services/notification
WORKDIR /app/services/notification
RUN npm run build

FROM node:22-alpine
WORKDIR /app/services/notification
ENV NODE_ENV=production
COPY --from=build /app/services/notification/dist ./dist
COPY --from=build /app/services/notification/node_modules ./node_modules
COPY --from=build /app/services/notification/package.json ./
EXPOSE 3008
CMD ["node", "dist/services/notification/src/index.js"]
