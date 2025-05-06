#!/bin/bash
set -e

echo "Starting initialization script..."

# Make sure we're in the right directory
cd /workspaces/openllm
echo "Current directory: $(pwd)"
ls -la

# Install dependencies
echo "Installing dependencies with pnpm..."
pnpm install

echo "Initialization complete!"
