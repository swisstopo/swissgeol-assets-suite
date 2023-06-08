FROM node:16-alpine as ui-builder

WORKDIR /app
COPY . .

ENV CYPRESS_INSTALL_BINARY=0
RUN apk add python3 make gcc g++

RUN npm install
RUN npx nx build client-asset-sg

# final image build
FROM nginx:mainline-alpine
LABEL maintainer=support@lambda-it.ch

WORKDIR /usr/share/nginx/html
COPY --from=ui-builder /app/dist/apps/client-asset-sg .

# this nginx base image will parse the template and will move it to 
# /etc/nginx/conf.d/default.conf before it starts nginx process
COPY container/nginx.conf /etc/nginx/templates/default.conf.template

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 CMD wget localhost -q -O - > /dev/null 2>&1

EXPOSE 80
