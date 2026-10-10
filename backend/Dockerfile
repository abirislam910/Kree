ARG NODE_VERSION=22.0.0

FROM node:${NODE_VERSION}-alpine

ENV NODE_ENV=production


WORKDIR /usr/src/app

COPY . .

EXPOSE 4000

USER node

CMD node server.js
