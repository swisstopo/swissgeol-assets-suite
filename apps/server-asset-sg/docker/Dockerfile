ARG APP_VERSION

FROM node:22-alpine AS api-builder

RUN apk add --no-cache openssl

ENV APP_VERSION=${APP_VERSION}
ENV NODE_ENV=development

WORKDIR /app
COPY . .

RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN=$(cat /run/secrets/github_token) \
    npm install --ignore-scripts \
 && npm run prisma -- generate   \
 && npx nx build server-asset-sg --configuration=production

# final image build
FROM node:22-alpine

RUN apk add --no-cache openssl

ENV APP_VERSION=${APP_VERSION}
ENV NODE_ENV=production

WORKDIR /app
COPY --from=api-builder /app/dist/apps/server-asset-sg .
COPY --from=api-builder /app/node_modules ./node_modules

RUN addgroup -S app \
 && adduser -S app -G app \
 && chown -R app:app /app
USER app

ENTRYPOINT ["node"]
CMD ["main.js"]
