FROM node:20-alpine as api-builder

WORKDIR /app
COPY . .

RUN npm install
RUN ./node_modules/.bin/prisma generate
RUN npx nx build server-asset-sg

# final image build
FROM node:20-alpine

WORKDIR /app
COPY --from=api-builder /app/dist/apps/server-asset-sg .
COPY --from=api-builder /app/node_modules ./node_modules

CMD ["node", "main.js"]
