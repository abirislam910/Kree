ARG NODE_VERSION=22.0.0

FROM node:${NODE_VERSION}-alpine

ENV NODE_ENV=production


WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY . .

EXPOSE 4000

USER node

CMD node server.js
