import {
  pgTable,
  text,
  varchar,
  jsonb,
  timestamp,
  integer
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
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

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

export const files = pgTable('files', {
  id:          varchar('id', { length: 500 }).primaryKey(), // R2 object key (e.g. "uploads/uuid.png")
  name:        varchar('name', { length: 255 }).notNull(),  // original filename
  url:         text('url').notNull(),                       // full public URL
  size:        integer('size').notNull(),                   // bytes
  contentType: varchar('content_type', { length: 127 }),    // MIME type
  folder:      varchar('folder', { length: 255 }),          // folder prefix
  provider:    varchar('provider', { length: 50 }).notNull().default('r2'),
  // nullable FKs — file record survives if uploader or page is deleted
  uploadedBy:  varchar('uploaded_by', { length: 36 })
                 .references(() => users.id, { onDelete: 'set null' }),
  pageId:      varchar('page_id', { length: 36 })
                 .references(() => pages.id, { onDelete: 'set null' }),
  createdAt:   timestamp('created_at').notNull(),
  updatedAt:   timestamp('updated_at').notNull()
});
