# Email Service Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Build stage
FROM base AS builder
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY tsconfig.base.json ./

# Copy packages
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/email-service ./apps/email-service

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter @smart-mail-guardian/database db:generate

# Build packages
RUN pnpm --filter @smart-mail-guardian/shared build
RUN pnpm --filter @smart-mail-guardian/database build
RUN pnpm --filter @smart-mail-guardian/email-service build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/apps/email-service/dist ./apps/email-service/dist
COPY --from=builder /app/apps/email-service/package.json ./apps/email-service/package.json

WORKDIR /app/apps/email-service

CMD ["node", "dist/index.js"]
