FROM node:24-alpine

WORKDIR /app

RUN corepack enable

# Admin depends on @workspace/db — build from monorepo root context
# (see docker-compose.yml: context: ., dockerfile: artifacts/fratelanza-admin/Dockerfile)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY lib/db/ lib/db/
COPY artifacts/fratelanza-admin/ artifacts/fratelanza-admin/

RUN pnpm install --frozen-lockfile --ignore-scripts --filter @workspace/fratelanza-admin... && \
    pnpm --filter @workspace/fratelanza-admin rebuild esbuild

WORKDIR /app/artifacts/fratelanza-admin

ENV NODE_ENV=production
ENV PORT=5050

EXPOSE 5050

CMD ["pnpm", "start"]
