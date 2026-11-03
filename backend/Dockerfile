ARG NODE_VERSION=22.0.0

# ---- Build: compile TypeScript with dev dependencies ----
FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npm run build

# ---- Runtime: production dependencies and compiled output only ----
FROM node:${NODE_VERSION}-alpine

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /usr/src/app/dist ./dist

EXPOSE 4000

USER node

CMD ["node", "dist/server.js"]
