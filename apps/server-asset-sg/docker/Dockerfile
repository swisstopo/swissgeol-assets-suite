ARG APP_VERSION

FROM node:22-alpine as api-builder

ENV APP_VERSION=${APP_VERSION}
ENV NODE_ENV=development

WORKDIR /app
COPY . .

RUN npm install
RUN npx nx build server-asset-sg --configuration=production

# final image build
FROM node:22-alpine

ENV APP_VERSION=${APP_VERSION}
ENV NODE_ENV=production

WORKDIR /app
COPY --from=api-builder /app/dist/apps/server-asset-sg .
COPY --from=api-builder /app/node_modules ./node_modules
COPY apps/server-asset-sg/docker/start.sh start.sh
RUN chmod +x start.sh

ENTRYPOINT ["sh"]
CMD ["start.sh"]
