FROM node:24-alpine

WORKDIR /app

RUN corepack enable

# Copy manifest first for better caching. We intentionally do NOT copy a
# lockfile: this folder is part of the parent monorepo and has no standalone
# lockfile of its own. pnpm will resolve fresh from package.json.
COPY package.json ./

# Install all deps. --ignore-scripts avoids pnpm v10's strict ERR_PNPM_IGNORED_BUILDS
# policy (it refuses to silently skip postinstall scripts). We then explicitly
# rebuild esbuild so its native binary gets installed — tsx needs it at runtime.
RUN pnpm install --prod=false --ignore-scripts && \
    pnpm rebuild esbuild

# Copy source
COPY tsconfig.json ./
COPY src ./src
COPY views ./views

ENV NODE_ENV=production
ENV PORT=5050

EXPOSE 5050

CMD ["pnpm", "start"]
