import { createDb, blocks, documents, eq } from '@workspace/db';
import type { PageEvent } from '@workspace/shared';
import type { Bindings } from '../types/env';

/**
 * Handles incoming PageEvents from the Cloudflare Queue.
 *
 * page.created  → inserts a default welcome block for the new page.
 * page.updated  → refreshes the associated Yjs document's updatedAt timestamp.
 * page.deleted  → removes the Yjs document state from the documents table.
 *                 (Block rows are already cascade-deleted at the DB level via
 *                  blocks.pageId → pages.id onDelete:'cascade'.)
 */
export async function handlePageEvent(event: PageEvent, env: Bindings): Promise<void> {
  const db = createDb(env.DATABASE_URL);

  switch (event.type) {
    case 'page.created': {
      const { pageId } = event.payload;

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

      console.log(`[page-service] page.created: inserted default heading block for page ${pageId}`);
      break;
    }

    case 'page.updated': {
      const { pageId } = event.payload;

      await db
        .update(documents)
        .set({ updatedAt: new Date() })
        .where(eq(documents.name, pageId));

      console.log(`[page-service] page.updated: refreshed document timestamp for page ${pageId}`);
      break;
    }

    case 'page.deleted': {
      const { pageId } = event.payload;

      // Block rows are already removed by the DB cascade; clean up the Yjs
      // document state that Hocuspocus persists in the documents table.
      const deleted = await db
        .delete(documents)
        .where(eq(documents.name, pageId))
        .returning();

      console.log(
        `[page-service] page.deleted: cleaned up document state for page ${pageId}`,
        deleted.length ? `(${deleted.length} document record removed)` : '(no document record found)'
      );
      break;
    }
  }
}
