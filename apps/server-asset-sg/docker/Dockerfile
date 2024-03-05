FROM node:16-alpine3.16

WORKDIR /app
COPY . .

RUN npm install
RUN ./node_modules/.bin/prisma generate
RUN npm run build -- server-asset-sg

CMD ["node", "main.js"]
