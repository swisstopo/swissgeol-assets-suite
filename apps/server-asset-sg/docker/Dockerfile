FROM node:20-alpine

WORKDIR /app
COPY . .

RUN npm install
RUN ./node_modules/.bin/prisma generate
RUN npx nx build server-asset-sg

CMD ["node", "main.js"]
