FROM node:22-alpine AS build
WORKDIR /app
COPY shared ./shared
COPY services/skills/package*.json ./services/skills/
RUN cd services/skills && npm ci
COPY services/skills ./services/skills
WORKDIR /app/services/skills
RUN npm run build

FROM node:22-alpine
WORKDIR /app/services/skills
ENV NODE_ENV=production
COPY --from=build /app/services/skills/dist ./dist
COPY --from=build /app/services/skills/node_modules ./node_modules
COPY --from=build /app/services/skills/package.json ./
EXPOSE 3003
CMD ["node", "dist/services/skills/src/index.js"]
