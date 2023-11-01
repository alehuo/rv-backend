FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm ci

COPY ./src ./src
COPY ./test ./test
COPY ./knexfile.ts .
COPY ./startup.sh .

RUN chmod +x ./startup.sh

CMD ["./startup.sh"]
