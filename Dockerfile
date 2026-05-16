FROM node:24-slim
WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY lib/ lib/
COPY artifacts/api-server/ artifacts/api-server/
COPY artifacts/fratelanza-hub/ artifacts/fratelanza-hub/
COPY scripts/ scripts/
COPY tsconfig.json tsconfig.base.json ./

RUN pnpm install --frozen-lockfile --ignore-scripts

RUN PORT=3000 BASE_PATH=/ pnpm --filter @workspace/fratelanza-hub run build

RUN pnpm --filter @workspace/api-server run build

ENV NODE_ENV=production
ENV PORT=3000
ENV STATIC_DIR=/app/artifacts/fratelanza-hub/dist/public

EXPOSE 3000

CMD ["/bin/sh", "-c", "pnpm --filter @workspace/db run push && node --enable-source-maps ./artifacts/api-server/dist/index.mjs"]
