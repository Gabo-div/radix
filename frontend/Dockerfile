# Frontend image for the throwaway test network (config/docker/testnet.yml).
# Builds the SPA and serves it from nginx, which also proxies /api to this
# node's own backend — the Vite dev proxy only exists in dev.

FROM oven/bun:1 AS build
WORKDIR /src

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM nginx:alpine
COPY --from=build /src/dist /usr/share/nginx/html
# The nginx image runs envsubst over /etc/nginx/templates/*.template at startup,
# which is how one image serves several nodes: BACKEND_URL differs per container.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
