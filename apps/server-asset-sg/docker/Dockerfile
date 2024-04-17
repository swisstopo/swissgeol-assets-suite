FROM node:20-alpine as api-builder

ENV NODE_ENV=development

WORKDIR /app
COPY . .

RUN npm install
RUN ./node_modules/.bin/prisma generate
RUN npx nx build server-asset-sg

# final image build
FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app
COPY --from=api-builder /app/dist/apps/server-asset-sg .
COPY --from=api-builder /app/node_modules ./node_modules
COPY apps/server-asset-sg/docker/start.sh start.sh
RUN chmod +x start.sh

ENTRYPOINT ["sh"]
CMD ["start.sh"]
