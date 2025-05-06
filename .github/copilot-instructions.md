# Instructions

## General

- always use pnpm for installing or managing dependencies, and running scripts
- never add unnecessary basic code comments
- use existing data fetching mechanisms using react-query and native fetch
- if creating new files, always add them to git using `git add <file>`
- after adding features, make sure that the tests pass using `pnpm test`
- after adding features, make sure that the build passes using `pnpm build`

## For database operations

- use drizzle with the latest object syntax
- for DB changes, do not write manual migration files
- if any tables or columns do not exist, run `pnpm sync` to sync the schema to the database
- do not apply any migrations, just use `pnpm sync`
- for read queries, always use `db().query.<table>.findMany()` or `db().query.<table>.findFirst()`
