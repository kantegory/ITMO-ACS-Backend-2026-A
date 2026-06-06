FROM node:22-alpine AS build
WORKDIR /app
COPY shared ./shared
COPY services/auth/package*.json ./services/auth/
RUN cd services/auth && npm ci
COPY services/auth ./services/auth
WORKDIR /app/services/auth
RUN npm run build

FROM node:22-alpine
WORKDIR /app/services/auth
ENV NODE_ENV=production
COPY --from=build /app/services/auth/dist ./dist
COPY --from=build /app/services/auth/node_modules ./node_modules
COPY --from=build /app/services/auth/package.json ./
EXPOSE 3001
CMD ["node", "dist/services/auth/src/index.js"]
