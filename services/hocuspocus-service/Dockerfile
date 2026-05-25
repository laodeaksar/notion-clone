FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json ./
COPY packages/db ./packages/db
COPY packages/shared ./packages/shared
COPY services/hocuspocus-service ./services/hocuspocus-service

RUN bun install --frozen-lockfile

WORKDIR /app/services/hocuspocus-service

EXPOSE 1234

CMD ["bun", "run", "src/index.ts"]
