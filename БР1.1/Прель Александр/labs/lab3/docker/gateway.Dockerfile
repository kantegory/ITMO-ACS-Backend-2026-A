FROM node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 AS build
WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
# Build native addons against the same libc as the runtime image.
RUN npm_config_build_from_source=true npm ci --include=dev --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
RUN npm run typecheck && npm run build && npm prune --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN mkdir /app/data && chown node:node /app/data
COPY --from=build /build/package.json ./
COPY --from=build /build/node_modules ./node_modules
COPY --from=build /build/dist/shared ./dist/shared
COPY --from=build /build/dist/messaging ./dist/messaging
COPY --from=build /build/dist/gateway ./dist/gateway
USER node
RUN node -e "require('sqlite3')"
EXPOSE 3000
CMD ["node", "dist/gateway/index.js"]
