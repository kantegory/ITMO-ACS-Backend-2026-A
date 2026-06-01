FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY packages ./packages
COPY services ./services
COPY gateway ./gateway

RUN bun install --frozen-lockfile

RUN cd services/auth && bunx prisma generate
RUN cd services/catalog && bunx prisma generate
RUN cd services/jobseeker && bunx prisma generate
RUN cd services/employer && bunx prisma generate
RUN cd services/application && bunx prisma generate

FROM deps AS with-entry
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

FROM with-entry AS gateway
ENV SERVICE_DIR=gateway

FROM with-entry AS auth
ENV SERVICE_DIR=services/auth

FROM with-entry AS catalog
ENV SERVICE_DIR=services/catalog

FROM with-entry AS jobseeker
ENV SERVICE_DIR=services/jobseeker

FROM with-entry AS employer
ENV SERVICE_DIR=services/employer

FROM with-entry AS application
ENV SERVICE_DIR=services/application
