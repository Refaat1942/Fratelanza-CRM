FROM node:24-alpine

WORKDIR /app

RUN corepack enable

# Copy manifests first for better caching
COPY package.json pnpm-lock.yaml* ./

# Install all deps (tsx is a runtime dep effectively via dev; promote if needed)
RUN pnpm install --prod=false --frozen-lockfile=false

# Copy source
COPY tsconfig.json ./
COPY src ./src
COPY views ./views

ENV NODE_ENV=production
ENV PORT=5050

EXPOSE 5050

CMD ["pnpm", "start"]
