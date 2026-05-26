-- Add user ownership to pages table.
-- Nullable so existing rows remain valid; service layer always enforces userId
-- on new writes and filters all reads by the authenticated user.
ALTER TABLE "pages"
  ADD COLUMN IF NOT EXISTS "user_id" varchar(36)
    REFERENCES "users"("id") ON DELETE CASCADE;
--> statement-breakpoint

-- Index for fast per-user page lookups (GET /pages, sidebar load)
CREATE INDEX IF NOT EXISTS "idx_pages_user_id"
  ON "pages" ("user_id");
