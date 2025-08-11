# syntax=docker/dockerfile:1
FROM node:20-slim

# Install netcat for wait-for-db and enable corepack
RUN apt-get update && apt-get install -y --no-install-recommends netcat-openbsd ca-certificates && rm -rf /var/lib/apt/lists/* && corepack enable

WORKDIR /app

# Copy monorepo files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages

# Use workspace pnpm
RUN corepack prepare pnpm@9.14.4 --activate && pnpm -w install --no-frozen-lockfile

# Build all packages first, then the builder
RUN pnpm -w --filter='packages/*' build
RUN pnpm -w --filter='@webstudio-is/builder' build

ENV NODE_ENV=production
EXPOSE 3000

# Wait for Postgres, run migrations, start server
CMD bash -lc 'until nc -z db 5432; do echo "waiting for db"; sleep 1; done; pnpm -w --filter="@webstudio-is/prisma-client" run migrations migrate && node apps/builder/build/server/index.js'