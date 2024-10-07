ARG APP_VERSION

FROM node:22-alpine as sync-builder

ENV APP_VERSION=${APP_VERSION}
ENV NODE_ENV=development

WORKDIR /app
COPY . .

RUN npm install --no-scripts
RUN npx nx build sync-asset-sg --configuration=production

# final image build
FROM node:22-alpine

ENV APP_VERSION=${APP_VERSION}
ENV NODE_ENV=production

WORKDIR /app
COPY --from=sync-builder /app/dist/apps/sync-asset-sg .
COPY --from=sync-builder /app/node_modules ./node_modules

RUN addgroup -S app \
 && adduser -S app -G app \
 && chown -R app:app /app
USER app

CMD ["node", "main.js"]
