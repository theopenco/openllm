# Instructions

## General

- always use pnpm for installing or managing dependencies, and running scripts

## For database operations

- use drizzle with the latest object syntax
- for DB changes, do not write manual migration files
- do not apply any migrations, just use `pnpm push`
- for read queries, always use `db().query.<table>.findMany()` or `db().query.<table>.findFirst()`
