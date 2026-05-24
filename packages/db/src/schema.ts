import { pgTable, serial, text, varchar, jsonb, timestamp, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const pages = pgTable('pages', {
  id: varchar('id', { length: 36 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  parentId: varchar('parent_id', { length: 36 }),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const blocks = pgTable('blocks', {
  id: varchar('id', { length: 36 }).primaryKey(),
  pageId: varchar('page_id', { length: 36 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  content: jsonb('content').notNull(),
  "order": integer('order').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});
