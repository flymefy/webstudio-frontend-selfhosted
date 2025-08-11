# syntax=docker/dockerfile:1
FROM node:20-slim

# Install netcat for wait-for-db and enable corepack
RUN apt-get update && apt-get install -y --no-install-recommends netcat-openbsd ca-certificates git which && rm -rf /var/lib/apt/lists/* && corepack enable

WORKDIR /app

# Copy monorepo files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY vite.sdk-components.config.ts ./
COPY patches ./patches
COPY apps ./apps
COPY packages ./packages

# Use workspace pnpm — install recursively to ensure all workspace node_modules and bins are linked
RUN corepack prepare pnpm@9.14.4 --activate \
  && pnpm -r install --no-frozen-lockfile \
  && pnpm -r --filter "@webstudio-is/builder" install

# Ensure local binaries are on PATH for scripts like `remix`
ENV PATH=/app/node_modules/.bin:$PATH

# Build all packages first, then the builder (explicit recursive run)
RUN pnpm -w -r --filter "./packages/*" run build
RUN pnpm -w --filter "@webstudio-is/builder" run build

ENV NODE_ENV=production
EXPOSE 3000

# Wait for Postgres, run migrations, start server
CMD bash -lc 'until nc -z db 5432; do echo "waiting for db"; sleep 1; done; pnpm -w --filter="@webstudio-is/prisma-client" run migrations migrate && node apps/builder/build/server/index.js'