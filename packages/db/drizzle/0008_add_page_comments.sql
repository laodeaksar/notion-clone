CREATE TABLE IF NOT EXISTS "page_comments" (
  "id"         VARCHAR(36) PRIMARY KEY,
  "page_id"    VARCHAR(36) NOT NULL REFERENCES "pages"("id") ON DELETE CASCADE,
  "user_id"    VARCHAR(36) REFERENCES "users"("id") ON DELETE SET NULL,
  "user_name"  VARCHAR(255),
  "quote"      TEXT NOT NULL,
  "text"       TEXT NOT NULL,
  "resolved"   BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_page_comments_page_id" ON "page_comments"("page_id");
CREATE INDEX IF NOT EXISTS "idx_page_comments_user_id" ON "page_comments"("user_id");
