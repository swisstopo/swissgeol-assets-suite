ARG APP_VERSION

FROM node:22-alpine as pipeline-builder

ENV APP_VERSION=${APP_VERSION}
ENV NODE_ENV=development

WORKDIR /app
COPY . .

RUN npm install --no-scripts
RUN npx nx build pipeline-asset-sg --configuration=production

# final image build
FROM node:22-alpine

ENV APP_VERSION=${APP_VERSION}
ENV NODE_ENV=production

WORKDIR /app
COPY --from=pipeline-builder /app/dist/apps/pipeline-asset-sg .
COPY --from=pipeline-builder /app/node_modules ./node_modules

RUN addgroup -S app \
 && adduser -S app -G app \
 && chown -R app:app /app
USER app

CMD ["node", "main.js"]
