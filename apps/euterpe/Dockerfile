# Build from monorepo root: docker build -f apps/euterpe/Dockerfile .
ARG NODE_IMAGE=node:20-slim
FROM ${NODE_IMAGE}

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .
RUN corepack enable pnpm && pnpm install --frozen-lockfile && pnpm --filter "euterpe..." build

WORKDIR /app/apps/euterpe
EXPOSE 3000

ENV NODE_ENV=production
CMD ["sh", "-c", "mkdir -p /data && pnpm exec drizzle-kit migrate && exec node dist/index.js"]
