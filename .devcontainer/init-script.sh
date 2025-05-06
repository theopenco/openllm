#!/bin/bash
set -e

echo "Setting up database connection..."

# Set the correct DATABASE_URL for the devcontainer environment
export DATABASE_URL=postgres://postgres:pw@postgres:5432/db

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -p 5432 -U postgres; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing command"

# Run the database push command
echo "Running database push..."
cd /workspaces/openllm
pnpm push-dev

echo "Database setup complete!"

# Make sure we're in the right directory
cd /workspaces/openllm
echo "Current directory: $(pwd)"
ls -la

# Install dependencies
echo "Installing dependencies with pnpm..."
pnpm install

echo "Initialization complete!"
