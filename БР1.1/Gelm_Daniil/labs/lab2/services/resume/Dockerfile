FROM node:22-alpine AS build
WORKDIR /app
COPY shared ./shared
COPY services/resume/package*.json ./services/resume/
RUN cd services/resume && npm ci
COPY services/resume ./services/resume
WORKDIR /app/services/resume
RUN npm run build

FROM node:22-alpine
WORKDIR /app/services/resume
ENV NODE_ENV=production
COPY --from=build /app/services/resume/dist ./dist
COPY --from=build /app/services/resume/node_modules ./node_modules
COPY --from=build /app/services/resume/package.json ./
EXPOSE 3004
CMD ["node", "dist/services/resume/src/index.js"]
