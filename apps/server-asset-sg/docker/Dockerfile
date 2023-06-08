FROM node:16-alpine3.16

WORKDIR /app
COPY . .

RUN npm install
RUN ./node_modules/.bin/prisma generate

CMD ["node", "main.js"]
