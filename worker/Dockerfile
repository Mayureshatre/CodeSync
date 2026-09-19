FROM node:24-alpine AS builder
RUN corepack enable

WORKDIR /app
COPY . .

# Install all dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm run postinstall

# Build shared types and core
RUN pnpm --filter @codesync/shared-types run build
RUN pnpm --filter @codesync/core run build

# Build the worker
RUN pnpm --filter worker run build

FROM node:24-alpine AS runner
RUN corepack enable

WORKDIR /app

# Copy the built monorepo
COPY --from=builder /app .

# Set working directory to worker
WORKDIR /app/worker

ENV NODE_ENV=production

# Start the worker
CMD ["node", "dist/index.js"]
