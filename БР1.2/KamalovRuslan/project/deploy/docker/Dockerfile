FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/monolith/package.json apps/monolith/package.json
COPY services/auth/package.json services/auth/package.json
COPY services/workout/package.json services/workout/package.json
COPY services/progress/package.json services/progress/package.json
COPY services/content/package.json services/content/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

COPY tsconfig.json tsconfig.base.json ./
COPY apps ./apps
COPY services ./services
COPY packages ./packages
RUN npm run build

FROM node:22-alpine AS runtime

ARG APP_PATH
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S fitflow && adduser -S -G fitflow fitflow
COPY --from=build --chown=fitflow:fitflow /app/package.json /app/package-lock.json ./
COPY --from=build --chown=fitflow:fitflow /app/node_modules ./node_modules
COPY --from=build --chown=fitflow:fitflow /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build --chown=fitflow:fitflow /app/packages/shared/dist ./packages/shared/dist
COPY --from=build --chown=fitflow:fitflow /app/${APP_PATH}/package.json ./${APP_PATH}/package.json
COPY --from=build --chown=fitflow:fitflow /app/${APP_PATH}/dist ./${APP_PATH}/dist
COPY --chown=fitflow:fitflow docs/openapi.yaml ./docs/openapi.yaml

USER fitflow
CMD ["node", "app.js"]
