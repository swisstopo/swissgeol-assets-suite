FROM node:22-alpine AS app-builder

RUN apk add --no-cache openssl

ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}
ENV CYPRESS_INSTALL_BINARY=0

RUN apk add --no-cache \
    gcc \
    g++ \
    make \
    python3

WORKDIR /app
COPY . .

RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN=$(cat /run/secrets/github_token) \
    sed -i ''s/0.0.0-local/${APP_VERSION}/g'' apps/client-asset-sg/src/assets/version.json \
 && npm install --ignore-scripts \
 && npm run prisma -- generate   \
 && npx nx build client-asset-sg --configuration=production

# final image build
FROM nginx:mainline-alpine

ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}

WORKDIR /usr/share/nginx/html
COPY --from=app-builder /app/dist/apps/client-asset-sg .

# this nginx base image will parse the template and will move it to
# /etc/nginx/conf.d/default.conf before it starts nginx process
COPY apps/client-asset-sg/docker/nginx.conf /etc/nginx/templates/default.conf.template

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["wget", "--quiet", "--spider", "http://localhost:80"]

EXPOSE 80
