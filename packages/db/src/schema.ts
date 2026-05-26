import {
  pgTable,
  index,
  text,
  varchar,
  jsonb,
  timestamp,
  integer,
  bigint
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id:           varchar('id', { length: 36 }).primaryKey(),
  email:        varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name:         varchar('name', { length: 255 }),
  createdAt:    timestamp('created_at').notNull(),
  updatedAt:    timestamp('updated_at').notNull()
});

export const pages = pgTable('pages', {
  id:        varchar('id', { length: 36 }).primaryKey(),
  title:     varchar('title', { length: 255 }).notNull(),
  // Self-referential FK — AnyPgColumn avoids circular reference TS error
  parentId:  varchar('parent_id', { length: 36 })
               .references((): AnyPgColumn => pages.id, { onDelete: 'set null' }),
  // Ownership: nullable for backward compat with pre-migration rows.
  // All new pages always carry a userId. The service layer enforces this.
  userId:    varchar('user_id', { length: 36 })
               .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
}, (t) => [
  index('idx_pages_user_id').on(t.userId)
]);

export const documents = pgTable('documents', {
  name:      varchar('name', { length: 255 }).primaryKey(),
  state:     text('state'),
  updatedAt: timestamp('updated_at').notNull()
});

export const blocks = pgTable('blocks', {
  id:        varchar('id', { length: 36 }).primaryKey(),
  // FK → pages.id: deleting a page removes all its blocks
  pageId:    varchar('page_id', { length: 36 })
               .notNull()
               .references(() => pages.id, { onDelete: 'cascade' }),
  type:      varchar('type', { length: 50 }).notNull(),
  content:   jsonb('content').notNull(),
  order:     integer('order').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const userStorageQuotas = pgTable('user_storage_quotas', {
  userId:     varchar('user_id', { length: 36 }).primaryKey()
                .references(() => users.id, { onDelete: 'cascade' }),
  usedBytes:  bigint('used_bytes', { mode: 'number' }).notNull().default(0),
  limitBytes: bigint('limit_bytes', { mode: 'number' }).notNull(),
  updatedAt:  timestamp('updated_at').notNull()
});

export const files = pgTable('files', {
  id:          varchar('id', { length: 500 }).primaryKey(),
  name:        varchar('name', { length: 255 }).notNull(),
  url:         text('url').notNull(),
  size:        integer('size').notNull(),
  contentType: varchar('content_type', { length: 127 }),
  folder:      varchar('folder', { length: 255 }),
  provider:    varchar('provider', { length: 50 }).notNull().default('r2'),
  uploadedBy:  varchar('uploaded_by', { length: 36 })
                 .references(() => users.id, { onDelete: 'set null' }),
  pageId:      varchar('page_id', { length: 36 })
                 .references(() => pages.id, { onDelete: 'set null' }),
  createdAt:   timestamp('created_at').notNull(),
  updatedAt:   timestamp('updated_at').notNull()
}, (t) => [
  index('idx_files_uploaded_by').on(t.uploadedBy),
  index('idx_files_page_id').on(t.pageId),
  index('idx_files_created_at').on(t.createdAt),
  index('idx_files_uploader_created').on(t.uploadedBy, t.createdAt),
  index('idx_files_page_created').on(t.pageId, t.createdAt),
]);

export const searchIndex = pgTable('search_index', {
  id:         varchar('id', { length: 36 }).primaryKey(),
  entityType: varchar('entity_type', { length: 20 }).notNull(),
  entityId:   varchar('entity_id', { length: 36 }).notNull().unique(),
  pageId:     varchar('page_id', { length: 36 }).notNull(),
  body:       text('body').notNull(),
  updatedAt:  timestamp('updated_at').notNull()
}, (t) => [
  index('idx_search_index_page_id').on(t.pageId)
]);
