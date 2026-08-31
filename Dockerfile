FROM node:22-bookworm-slim AS build

ENV PNPM_HOME=/pnpm \
    PATH="/pnpm:$PATH" \
    CI=1

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:1.27-alpine AS serve

# Без флага NGINX_LOCAL_RESOLVERS остаётся пустым и конфиг не соберётся.
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
ENV CLIENT_MAX_BODY_SIZE=12m

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["wget", "--quiet", "--spider", "http://127.0.0.1/healthz"]
