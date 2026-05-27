---
name: DB migration state and better-auth schema
description: DB tables required for better-auth and how to apply migrations that drizzle-kit silently skips
---

**better-auth requires these tables** (not in initial migration, added in 0007_add_auth_tables.sql):
- `sessions` — id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id
- `accounts` — id, account_id, provider_id, user_id, access_token, refresh_token, id_token, scope, password, timestamps
- `verifications` — id, identifier, value, expires_at, created_at, updated_at

**users table extra columns** also added in 0007:
- `email_verified boolean NOT NULL DEFAULT false`
- `image text`
- `password_hash` changed from NOT NULL to nullable

**Drizzle-kit silent skip**: If migration `when` timestamp in `_journal.json` is less than existing entries, drizzle-kit may mark it as applied without running the SQL. Fix: run migration directly via `psql "$DATABASE_URL" -f <migration>.sql` and insert hash manually into `drizzle.__drizzle_migrations`.

**Why:** better-auth's drizzle adapter queries these columns at runtime; missing columns cause `42703 errorMissingColumn` errors that surface as HTTP 500 on sign-up/sign-in.
