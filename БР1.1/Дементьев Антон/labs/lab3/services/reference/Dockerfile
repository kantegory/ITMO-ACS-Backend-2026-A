FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/common/package.json packages/common/
COPY services/gateway/package.json services/gateway/
COPY services/identity/package.json services/identity/
COPY services/reference/package.json services/reference/
COPY services/vacancy/package.json services/vacancy/
COPY services/resume/package.json services/resume/
COPY services/application/package.json services/application/
COPY services/recommendation/package.json services/recommendation/
COPY services/notification/package.json services/notification/
RUN npm install

FROM deps AS runtime
COPY . .
EXPOSE 8002
CMD ["npx", "tsx", "services/reference/src/app.ts"]
