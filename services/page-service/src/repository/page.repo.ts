import { eq, and } from '@workspace/db';
import { pages } from '@workspace/db';
import type { Db } from '@workspace/db';
import type { PageInput, PageUpdate, Page } from '../types/page.types';

export function createPageRepo(db: Db) {
  return {
    /**
     * Returns all pages owned by the given user.
     * Optionally filtered by parentId for tree-level queries.
     * Pages are always scoped to the requesting user — cross-user access is impossible.
     */
    async findAll(userId: string, parentId?: string): Promise<Page[]> {
      const condition = parentId
        ? and(eq(pages.userId, userId), eq(pages.parentId, parentId))
        : eq(pages.userId, userId);

      return db.select().from(pages).where(condition) as Promise<Page[]>;
    },

    /**
     * Fetches a single page only if it belongs to the given user.
     * Returns null for not-found AND for pages owned by other users — both
     * look identical to the caller to avoid leaking existence information.
     */
    async findById(id: string, userId: string): Promise<Page | null> {
      const rows = await db
        .select()
        .from(pages)
        .where(and(eq(pages.id, id), eq(pages.userId, userId)));
      return (rows[0] as Page) ?? null;
    },

    async create(input: PageInput, userId: string): Promise<Page> {
      const now = new Date();
      const [page] = await db
        .insert(pages)
        .values({
          id:        crypto.randomUUID(),
          title:     input.title,
          parentId:  input.parentId ?? null,
          userId,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      return page as Page;
    },

    /**
     * Updates a page only if it is owned by the given user.
     * Returns null if the page does not exist or belongs to another user.
     */
    async update(id: string, input: PageUpdate, userId: string): Promise<Page | null> {
      const now = new Date();
      const [page] = await db
        .update(pages)
        .set({
          ...(input.title    !== undefined && { title:    input.title    }),
          ...(input.parentId !== undefined && { parentId: input.parentId }),
          updatedAt: now
        })
        .where(and(eq(pages.id, id), eq(pages.userId, userId)))
        .returning();
      return (page as Page) ?? null;
    },

    async delete(id: string, userId: string): Promise<boolean> {
      const rows = await db
        .delete(pages)
        .where(and(eq(pages.id, id), eq(pages.userId, userId)))
        .returning();
      return rows.length > 0;
    }
  };
}
