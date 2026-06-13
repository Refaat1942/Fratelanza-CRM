FROM node:24-alpine

WORKDIR /app

RUN corepack enable

# Monorepo workspace roots — @workspace/fratelanza-admin depends on @workspace/db.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./

# Workspace packages required by the admin app (match root app Dockerfile pattern).
COPY lib/db/ lib/db/
COPY artifacts/fratelanza-admin/package.json artifacts/fratelanza-admin/

RUN pnpm install --frozen-lockfile --ignore-scripts --filter @workspace/fratelanza-admin... && \
    pnpm rebuild esbuild

COPY artifacts/fratelanza-admin/tsconfig.json artifacts/fratelanza-admin/
COPY artifacts/fratelanza-admin/src artifacts/fratelanza-admin/src
COPY artifacts/fratelanza-admin/views artifacts/fratelanza-admin/views

WORKDIR /app/artifacts/fratelanza-admin

ENV NODE_ENV=production
ENV PORT=5050

EXPOSE 5050

CMD ["pnpm", "start"]
