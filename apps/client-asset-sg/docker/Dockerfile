FROM node:22-alpine as app-builder

ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}
ENV CYPRESS_INSTALL_BINARY=0

RUN apk add python3 make gcc g++

WORKDIR /app
COPY . .

RUN npm install
RUN sed -i ''s/0.0.0-local/${APP_VERSION}/g'' apps/client-asset-sg/src/assets/version.json
RUN npx nx build client-asset-sg --configuration=production

# final image build
FROM nginx:mainline-alpine

ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}

WORKDIR /usr/share/nginx/html
COPY --from=app-builder /app/dist/apps/client-asset-sg .

# this nginx base image will parse the template and will move it to
# /etc/nginx/conf.d/default.conf before it starts nginx process
COPY container/nginx.conf /etc/nginx/templates/default.conf.template

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 CMD wget localhost -q -O - > /dev/null 2>&1

EXPOSE 80
