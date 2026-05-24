import { eq } from 'drizzle-orm';
import { pages } from '@workspace/db/src/schema';
import type { Db } from '../config';
import type { PageInput, PageUpdate, Page } from '../types/page.types';

export function createPageRepo(db: Db) {
  return {
    async findAll(parentId?: string): Promise<Page[]> {
      let query = db.select().from(pages);
      if (parentId) {
        query = query.where(eq(pages.parentId, parentId)) as typeof query;
      }
      return query as Promise<Page[]>;
    },

    async findById(id: string): Promise<Page | null> {
      const rows = await db.select().from(pages).where(eq(pages.id, id));
      return (rows[0] as Page) ?? null;
    },

    async create(input: PageInput): Promise<Page> {
      const now = new Date();
      const [page] = await db
        .insert(pages)
        .values({
          id: crypto.randomUUID(),
          title: input.title,
          parentId: input.parentId ?? null,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      return page as Page;
    },

    async update(id: string, input: PageUpdate): Promise<Page | null> {
      const now = new Date();
      const [page] = await db
        .update(pages)
        .set({
          ...(input.title !== undefined && { title: input.title }),
          ...(input.parentId !== undefined && { parentId: input.parentId }),
          updatedAt: now
        })
        .where(eq(pages.id, id))
        .returning();
      return (page as Page) ?? null;
    },

    async delete(id: string): Promise<boolean> {
      const rows = await db.delete(pages).where(eq(pages.id, id)).returning();
      return rows.length > 0;
    }
  };
}
