FROM node:22-bookworm AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY reference-service/tsconfig.json ./
COPY reference-service/src ./src
RUN npx tsc -p tsconfig.json
RUN npm prune --omit=dev

FROM node:22-bookworm

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 8006

CMD ["node", "dist/app.js"]
