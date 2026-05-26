-- Enable pg_trgm for GIN-accelerated ILIKE / similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint

CREATE TABLE "search_index" (
  "id"          varchar(36)  PRIMARY KEY NOT NULL,
  "entity_type" varchar(20)  NOT NULL,
  "entity_id"   varchar(36)  NOT NULL,
  "page_id"     varchar(36)  NOT NULL,
  "body"        text         NOT NULL,
  "updated_at"  timestamp    NOT NULL
);
--> statement-breakpoint

-- Unique constraint: one row per entity (page or block)
CREATE UNIQUE INDEX "idx_search_entity_id"
  ON "search_index" ("entity_id");
--> statement-breakpoint

-- Regular B-tree index for bulk-deletes on page.deleted
CREATE INDEX "idx_search_index_page_id"
  ON "search_index" ("page_id");
--> statement-breakpoint

-- GIN trigram index: makes ILIKE '%term%' queries O(log n) instead of O(n)
CREATE INDEX "idx_search_index_body_trgm"
  ON "search_index" USING GIN (body gin_trgm_ops);
