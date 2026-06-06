FROM node:22-alpine AS build
WORKDIR /app
COPY shared ./shared
COPY services/company/package*.json ./services/company/
RUN cd services/company && npm ci
COPY services/company ./services/company
WORKDIR /app/services/company
RUN npm run build

FROM node:22-alpine
WORKDIR /app/services/company
ENV NODE_ENV=production
COPY --from=build /app/services/company/dist ./dist
COPY --from=build /app/services/company/node_modules ./node_modules
COPY --from=build /app/services/company/package.json ./
EXPOSE 3002
CMD ["node", "dist/services/company/src/index.js"]
