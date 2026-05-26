import { createDb, blocks, documents, pages, searchIndex, eq } from '@workspace/db';
import type { PageEvent } from '@workspace/shared';
import type { Bindings } from '../types/env';

/**
 * Handles incoming PageEvents from the Cloudflare Queue.
 *
 * page.created  → inserts a default welcome block + indexes the page title.
 * page.updated  → refreshes the Yjs document timestamp + re-indexes the title.
 * page.deleted  → removes Yjs document state + all search_index rows for the page.
 *                 (Block rows are already cascade-deleted at the DB level via
 *                  blocks.pageId → pages.id onDelete:'cascade'.)
 */
export async function handlePageEvent(event: PageEvent, env: Bindings): Promise<void> {
  const db = createDb(env.DATABASE_URL);

  switch (event.type) {
    case 'page.created': {
      const { pageId } = event.payload;

      // Insert a default empty heading block for the new page
      await db
        .insert(blocks)
        .values({
          id:        crypto.randomUUID(),
          pageId,
          type:      'heading',
          content:   { level: 1, text: '' },
          order:     0,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .onConflictDoNothing();

      // Index the page title for full-text search
      const [page] = await db.select().from(pages).where(eq(pages.id, pageId));
      if (page) {
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

      console.log(`[page-service] page.created: block + search entry created for page ${pageId}`);
      break;
    }

    case 'page.updated': {
      const { pageId } = event.payload;

      // Keep the Yjs document's updatedAt in sync
      await db
        .update(documents)
        .set({ updatedAt: new Date() })
        .where(eq(documents.name, pageId));

      // Re-index with the latest title
      const [page] = await db.select().from(pages).where(eq(pages.id, pageId));
      if (page) {
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
        console.log(`[page-service] page.updated: search index refreshed for page ${pageId} ("${page.title}")`);
      } else {
        console.warn(`[page-service] page.updated: page ${pageId} not found — skipped search index update`);
      }
      break;
    }

    case 'page.deleted': {
      const { pageId } = event.payload;

      // Remove Yjs document state (blocks already cascade-deleted by DB)
      const deleted = await db
        .delete(documents)
        .where(eq(documents.name, pageId))
        .returning();

      // Bulk-remove all search_index entries owned by this page (page + blocks)
      const removedRows = await db
        .delete(searchIndex)
        .where(eq(searchIndex.pageId, pageId))
        .returning();

      console.log(
        `[page-service] page.deleted: cleaned up page ${pageId}`,
        `— ${deleted.length} document record(s),`,
        `${removedRows.length} search index row(s) removed`
      );
      break;
    }
  }
}
