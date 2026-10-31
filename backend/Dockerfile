ARG NODE_VERSION

FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN yarn build

FROM node:${NODE_VERSION}-alpine AS production

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --production && yarn cache clean

COPY --from=build /app/dist ./dist

ARG API_PORT
EXPOSE ${API_PORT}

CMD ["node", "dist/infra/http/server.js"]
