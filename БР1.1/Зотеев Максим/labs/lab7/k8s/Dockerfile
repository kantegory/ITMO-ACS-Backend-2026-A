# One production image for every lab2 component; each Deployment picks its entry point.
# Build context is labs/lab2 (see image.sh). lab2's own Dockerfiles stay for docker-compose.
ARG NODE_IMAGE=node:22-bookworm-slim@sha256:e9f565d32859f0cbfb52125eafe8be39390f24dac302dc3cdf566e8ba3ab21ee

FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY services/api-gateway/package.json services/api-gateway/
COPY services/identity-service/package.json services/identity-service/
COPY services/property-service/package.json services/property-service/
COPY services/rental-service/package.json services/rental-service/
COPY services/messaging-service/package.json services/messaging-service/
RUN npm ci --no-audit --no-fund
COPY packages packages
COPY services services
RUN npm run build:all

FROM ${NODE_IMAGE}
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/packages/shared/package.json packages/shared/
COPY --from=build /app/services/api-gateway/package.json services/api-gateway/
COPY --from=build /app/services/identity-service/package.json services/identity-service/
COPY --from=build /app/services/property-service/package.json services/property-service/
COPY --from=build /app/services/rental-service/package.json services/rental-service/
COPY --from=build /app/services/messaging-service/package.json services/messaging-service/
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/services/api-gateway/dist services/api-gateway/dist
COPY --from=build /app/services/identity-service/dist services/identity-service/dist
COPY --from=build /app/services/property-service/dist services/property-service/dist
COPY --from=build /app/services/rental-service/dist services/rental-service/dist
COPY --from=build /app/services/rental-service/outbox services/rental-service/outbox
COPY --from=build /app/services/messaging-service/dist services/messaging-service/dist
# uid 1000, the same user the manifests set in runAsUser.
USER node
