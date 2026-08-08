FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp     && chown -R nodeapp:nodeapp /app
USER nodeapp
CMD ["node", "dist/training-plan-service/app.js"]
