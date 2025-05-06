FROM mcr.microsoft.com/devcontainers/javascript-node:0-20

# Install pnpm with the specific version
ARG PNPM_VERSION=10.8.0
RUN npm install -g pnpm@${PNPM_VERSION}

# Install PostgreSQL client tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends postgresql-client

# Set the working directory
WORKDIR /workspaces/openllm

# Create directory structure for package.json files
RUN mkdir -p apps/api apps/gateway apps/ui packages/auth packages/db packages/models
RUN alias p=pnpm

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/gateway/package.json ./apps/gateway/
COPY apps/ui/package.json ./apps/ui/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db/package.json ./packages/db/
COPY packages/models/package.json ./packages/models/

# Install dependencies
RUN pnpm install

# The rest of the source code will be mounted at runtime
