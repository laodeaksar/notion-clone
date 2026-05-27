import { pages, searchIndex, eq } from '@workspace/db';
import type { Db } from '@workspace/db';

/**
 * Upsert the page title into search_index.
 * Called directly after create/update so search works without a Queue consumer.
 */
export async function indexPage(db: Db, pageId: string): Promise<void> {
  const [page] = await db.select().from(pages).where(eq(pages.id, pageId));
  if (!page) return;

  await db
    .insert(searchIndex)
    .values({
      id:         crypto.randomUUID(),
      entityType: 'page',
      entityId:   pageId,
      pageId,
      body:       page.title,
      updatedAt:  new Date()
    })
    .onConflictDoUpdate({
      target: searchIndex.entityId,
      set:    { body: page.title, updatedAt: new Date() }
    });
}

/**
 * Remove all search_index entries owned by this page (page row + all its block rows).
 * Called directly after delete so the index stays clean without a Queue consumer.
 */
export async function cleanPageIndex(db: Db, pageId: string): Promise<void> {
  await db.delete(searchIndex).where(eq(searchIndex.pageId, pageId));
}
