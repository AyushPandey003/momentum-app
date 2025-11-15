# Database Setup Guide

## Quick Start

1. **Run database migrations** to create all tables:
   ```bash
   pnpm db:push
   ```

2. **Seed questions** (optional but recommended):
   ```bash
   pnpm seed:questions
   ```

3. **Verify setup**:
   ```bash
   pnpm check:contest
   ```

## Troubleshooting

### Error: "relation 'problem_set' does not exist"

This means the database tables haven't been created yet. Run:

```bash
pnpm db:push
```

This will create all tables defined in `db/schema.ts`.

### Error: "Invalid relation 'submissions' for table 'contest_participant'"

This has been fixed in the schema. If you still see this error:

1. Make sure you have the latest schema changes
2. Restart Drizzle Studio: `pnpm db:studio`

### Go Backend Can't Find Tables

The Go backend shares the same database as the Next.js frontend. Make sure:

1. Both use the same `DATABASE_URL` environment variable
2. Migrations have been run: `pnpm db:push`
3. The database connection string is correct

## Database Commands

```bash
# Push schema changes to database (creates/updates tables)
pnpm db:push

# Open Drizzle Studio (database GUI)
pnpm db:studio

# Generate migration files
pnpm db:generate

# Seed questions
pnpm seed:questions

# Check contest setup
pnpm check:contest
```

## Schema Files

- **Schema Definition**: `db/schema.ts`
- **Drizzle Config**: `drizzle.config.ts`
- **Migrations**: `migrations/` (auto-generated)

## Important Notes

- The Go backend and Next.js frontend **share the same database**
- Always run `pnpm db:push` after schema changes
- The Go backend will show helpful error messages if tables don't exist

