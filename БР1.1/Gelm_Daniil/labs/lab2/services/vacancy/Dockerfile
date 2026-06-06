FROM node:22-alpine AS build
WORKDIR /app
COPY shared ./shared
COPY services/vacancy/package*.json ./services/vacancy/
RUN cd services/vacancy && npm ci
COPY services/vacancy ./services/vacancy
WORKDIR /app/services/vacancy
RUN npm run build

FROM node:22-alpine
WORKDIR /app/services/vacancy
ENV NODE_ENV=production
COPY --from=build /app/services/vacancy/dist ./dist
COPY --from=build /app/services/vacancy/node_modules ./node_modules
COPY --from=build /app/services/vacancy/package.json ./
EXPOSE 3005
CMD ["node", "dist/services/vacancy/src/index.js"]
