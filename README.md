# OpenLLM

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start development servers:

   ```bash
   pnpm dev
   ```

3. Build for production:
   ```bash
   pnpm build
   ```

## Folder Structure

- `apps/ui`: Vite + React frontend
- `apps/api`: Hono backend
- `packages/db`: Drizzle ORM schema and migrations
- `packages/shared`: Shared types and utilities (optional)
