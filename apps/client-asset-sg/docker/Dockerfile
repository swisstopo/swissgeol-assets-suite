FROM node:26.13.1-alpine AS app-builder

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
    export GITHUB_TOKEN=$(cat /run/secrets/github_token) \
 && sed -i ''s/0.0.0-local/${APP_VERSION}/g'' apps/client-asset-sg/src/assets/version.json \
 && npm install --ignore-scripts \
 && npm run prisma -- generate   \
 && npx nx build client-asset-sg --configuration=production

# final image build
# Pinned to the current patched release (nginx.org/en/security_advisories.html).
# Uses the unprivileged variant so the container never runs as root (port 8080 instead of 80).
FROM nginx/nginx-unprivileged:1.31.9-alpine3.24

ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}

# Declare the non-root runtime user explicitly for static analysis.
USER nginx

WORKDIR /usr/share/nginx/html
COPY --chown=root:root --from=app-builder /app/dist/apps/client-asset-sg .

# this nginx base image will parse the template and will move it to
# /etc/nginx/conf.d/default.conf before it starts nginx process
COPY --chown=root:root apps/client-asset-sg/docker/nginx.conf /etc/nginx/templates/default.conf.template

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["wget", "--quiet", "--spider", "http://localhost:8080"]

EXPOSE 8080
