FROM mcr.microsoft.com/devcontainers/javascript-node:0-20

# Install pnpm with the specific version
ARG PNPM_VERSION=10.8.0
RUN npm install -g pnpm@${PNPM_VERSION}

# Install PostgreSQL client tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends postgresql-client

# Set the working directory
WORKDIR /workspaces/llmgateway

# Create directory structure for package.json files
RUN mkdir -p apps/api apps/gateway apps/ui packages/auth packages/db packages/models
