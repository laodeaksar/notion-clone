import {
  pgTable,
  index,
  text,
  varchar,
  jsonb,
  timestamp,
  integer,
  bigint,
  boolean
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

// ─── better-auth: user table (extends existing users) ────────────────────────

export const users = pgTable('users', {
  id:            varchar('id', { length: 36 }).primaryKey(),
  email:         varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  passwordHash:  text('password_hash'),
  name:          varchar('name', { length: 255 }),
  image:         text('image'),
  createdAt:     timestamp('created_at').notNull(),
  updatedAt:     timestamp('updated_at').notNull()
});

// ─── better-auth: session table ───────────────────────────────────────────────

export const sessions = pgTable('sessions', {
  id:        text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token:     text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId:    varchar('user_id', { length: 36 })
               .notNull()
               .references(() => users.id, { onDelete: 'cascade' })
}, (t) => [
  index('idx_sessions_user_id').on(t.userId),
  index('idx_sessions_token').on(t.token)
]);

// ─── better-auth: account table (stores credentials / OAuth tokens) ───────────

export const accounts = pgTable('accounts', {
  id:                   text('id').primaryKey(),
  accountId:            text('account_id').notNull(),
  providerId:           text('provider_id').notNull(),
  userId:               varchar('user_id', { length: 36 })
                          .notNull()
                          .references(() => users.id, { onDelete: 'cascade' }),
  accessToken:          text('access_token'),
  refreshToken:         text('refresh_token'),
  idToken:              text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt:timestamp('refresh_token_expires_at'),
  scope:                text('scope'),
  password:             text('password'),
  createdAt:            timestamp('created_at').notNull(),
  updatedAt:            timestamp('updated_at').notNull()
}, (t) => [
  index('idx_accounts_user_id').on(t.userId)
]);

// ─── better-auth: verification table ─────────────────────────────────────────

export const verifications = pgTable('verifications', {
  id:         text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value:      text('value').notNull(),
  expiresAt:  timestamp('expires_at').notNull(),
  createdAt:  timestamp('created_at'),
  updatedAt:  timestamp('updated_at')
});

// ─── Application tables ───────────────────────────────────────────────────────

export const pages = pgTable('pages', {
  id:        varchar('id', { length: 36 }).primaryKey(),
  title:     varchar('title', { length: 255 }).notNull(),
  parentId:  varchar('parent_id', { length: 36 })
               .references((): AnyPgColumn => pages.id, { onDelete: 'set null' }),
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
  pageId:    varchar('page_id', { length: 36 })
               .notNull()
               .references(() => pages.id, { onDelete: 'cascade' }),
  type:      varchar('type', { length: 50 }).notNull(),
  content:   jsonb('content').notNull(),
  order:     integer('order').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
}, (t) => [
  index('idx_blocks_page_id').on(t.pageId)
]);

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

export const pageComments = pgTable('page_comments', {
  id:        varchar('id', { length: 36 }).primaryKey(),
  pageId:    varchar('page_id', { length: 36 }).notNull()
               .references(() => pages.id, { onDelete: 'cascade' }),
  userId:    varchar('user_id', { length: 36 })
               .references(() => users.id, { onDelete: 'set null' }),
  userName:  varchar('user_name', { length: 255 }),
  quote:     text('quote').notNull(),
  text:      text('text').notNull(),
  resolved:  boolean('resolved').notNull().default(false),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
}, (t) => [
  index('idx_page_comments_page_id').on(t.pageId),
  index('idx_page_comments_user_id').on(t.userId)
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
