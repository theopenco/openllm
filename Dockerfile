# Build stage
FROM node:20-alpine AS builder
RUN apk add curl

# Create app directory
WORKDIR /app

COPY .tool-versions ./
RUN curl -fsSL "https://github.com/pnpm/pnpm/releases/download/v$(cat .tool-versions | grep 'pnpm' | cut -d ' ' -f 2)/pnpm-linuxstatic-x64" -o /bin/pnpm; chmod +x /bin/pnpm;

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/gateway/package.json ./apps/gateway/
COPY apps/ui/package.json ./apps/ui/
COPY apps/docs/package.json ./apps/docs/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db/package.json ./packages/db/
COPY packages/models/package.json ./packages/models/

RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build all apps
RUN pnpm build


# Production images for each app
FROM node:20-alpine AS api
WORKDIR /app
EXPOSE 3002
CMD ["node", "apps/api/dist/serve.js"]

FROM node:20-alpine AS gateway
WORKDIR /app
EXPOSE 4001
CMD ["node", "apps/gateway/dist/serve.js"]

FROM node:20-alpine AS ui
WORKDIR /app
EXPOSE 4002
CMD ["node", "apps/ui/.vinxi/server/index.js"]

FROM node:20-alpine AS docs
WORKDIR /app
EXPOSE 3005
CMD ["node", "apps/docs/.next/server.js"]
