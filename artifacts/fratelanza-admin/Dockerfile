FROM node:24-alpine

WORKDIR /app

RUN corepack enable

# Copy manifest first for better caching. We intentionally do NOT copy a
# lockfile: this folder is part of the parent monorepo and has no standalone
# lockfile of its own. pnpm will resolve fresh from package.json.
COPY package.json ./

# Install all deps (tsx is a runtime dep effectively via dev; promote if needed)
RUN pnpm install --prod=false

# Copy source
COPY tsconfig.json ./
COPY src ./src
COPY views ./views

ENV NODE_ENV=production
ENV PORT=5050

EXPOSE 5050

CMD ["pnpm", "start"]
