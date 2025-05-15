# Build stage
FROM node:20.10.0-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10.8.0

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/gateway/package.json ./apps/gateway/
COPY apps/ui/package.json ./apps/ui/
COPY apps/docs/package.json ./apps/docs/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db/package.json ./packages/db/
COPY packages/models/package.json ./packages/models/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build all apps
RUN pnpm build

# Production images for each app
FROM node:20.10.0-alpine AS api
WORKDIR /app
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages ./packages
RUN pnpm install --frozen-lockfile --prod
EXPOSE 3000
CMD ["node", "apps/api/dist/serve.js"]

FROM node:20.10.0-alpine AS gateway
WORKDIR /app
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/gateway/package.json ./apps/gateway/
COPY --from=builder /app/apps/gateway/dist ./apps/gateway/dist
COPY --from=builder /app/packages ./packages
RUN pnpm install --frozen-lockfile --prod
EXPOSE 3001
CMD ["node", "apps/gateway/dist/serve.js"]

FROM node:20.10.0-alpine AS ui
WORKDIR /app
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/ui/package.json ./apps/ui/
COPY --from=builder /app/apps/ui/.vinxi ./apps/ui/.vinxi
COPY --from=builder /app/packages ./packages
RUN pnpm install --frozen-lockfile --prod
EXPOSE 3002
CMD ["node", "apps/ui/.vinxi/server/index.js"]

FROM node:20.10.0-alpine AS docs
WORKDIR /app
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/docs/package.json ./apps/docs/
COPY --from=builder /app/apps/docs/.next ./apps/docs/.next
COPY --from=builder /app/packages ./packages
RUN pnpm install --frozen-lockfile --prod
EXPOSE 3005
CMD ["node", "apps/docs/.next/server.js"]
