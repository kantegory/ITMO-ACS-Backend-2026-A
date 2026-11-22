# Этап сборки: зависимости, компиляция TypeScript, удаление dev-зависимостей
FROM node:20-alpine AS build
RUN apk add --no-cache git
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build && npm prune --omit=dev

# Итоговый образ: только Node.js, production-зависимости и скомпилированный код.
# npm, yarn и corepack удалены: в рантайме они не нужны,
# а их собственные зависимости дают уязвимости в отчёте Trivy.
FROM node:20-alpine
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /opt/yarn-* /usr/local/bin/yarn /usr/local/bin/yarnpkg
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/app.js"]
