import { eq, and, sql } from '@workspace/db';
import { pages } from '@workspace/db';
import type { Db } from '@workspace/db';
import type { PageInput, PageUpdate, Page } from '../types/page.types';

export function createPageRepo(db: Db) {
  return {
    /**
     * Returns all pages owned by the given user.
     * Optionally filtered by parentId for tree-level queries.
     */
    async findAll(userId: string, parentId?: string): Promise<Page[]> {
      const condition = parentId
        ? and(eq(pages.userId, userId), eq(pages.parentId, parentId))
        : eq(pages.userId, userId);

      return db.select().from(pages).where(condition) as Promise<Page[]>;
    },

    /**
     * Fetches a single page only if it belongs to the given user.
     * Returns null for not-found AND for pages owned by other users —
     * both look identical to the caller to prevent leaking existence info.
     */
    async findById(id: string, userId: string): Promise<Page | null> {
      const rows = await db
        .select()
        .from(pages)
        .where(and(eq(pages.id, id), eq(pages.userId, userId)));
      return (rows[0] as Page) ?? null;
    },

    /**
     * Walks the parent chain for a given page using a single recursive CTE —
     * replaces the old N sequential round-trips with one DB query.
     *
     * Returns ancestors in root-first order (root → … → direct parent),
     * capped at 10 levels to guard against cycles.
     */
    async findAncestors(id: string, userId: string): Promise<Page[]> {
      const result = await db.execute(sql`
        WITH RECURSIVE ancestors AS (
          SELECT
            p.id, p.title, p.parent_id, p.user_id, p.created_at, p.updated_at,
            1 AS depth
          FROM pages p
          INNER JOIN pages child ON child.parent_id = p.id
          WHERE child.id      = ${id}
            AND child.user_id = ${userId}
            AND p.user_id     = ${userId}

          UNION ALL

          SELECT
            p.id, p.title, p.parent_id, p.user_id, p.created_at, p.updated_at,
            a.depth + 1
          FROM pages p
          INNER JOIN ancestors a ON a.parent_id = p.id
          WHERE p.user_id = ${userId}
            AND a.depth   < 10
        )
        SELECT id, title, parent_id AS "parentId", user_id AS "userId",
               created_at AS "createdAt", updated_at AS "updatedAt"
        FROM ancestors
        ORDER BY depth DESC
      `);

      return (result.rows ?? []) as Page[];
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
