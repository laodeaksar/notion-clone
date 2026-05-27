import { createDb, blocks, documents, eq } from '@workspace/db';
import { indexPage, cleanPageIndex } from '../services/search.indexer';
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
      // (idempotent — page.service already inserts one directly, this is the prod fallback)
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
      await indexPage(db, pageId);

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
      await indexPage(db, pageId);

      console.log(`[page-service] page.updated: search index refreshed for page ${pageId}`);
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
      await cleanPageIndex(db, pageId);

      console.log(
        `[page-service] page.deleted: cleaned up page ${pageId}`,
        `— ${deleted.length} document record(s) removed`
      );
      break;
    }
  }
}
