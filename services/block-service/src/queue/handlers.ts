import { createDb, pages, eq } from '@workspace/db';
import type { BlockEvent } from '@workspace/shared';
import type { Bindings } from '../types/env';

/**
 * Handles incoming BlockEvents from the Cloudflare Queue.
 *
 * block.created → touches the parent page's updatedAt so clients see
 *                 the page as recently modified.
 * block.updated → same touch — content of a block changed.
 * block.deleted → same touch — block removed from a page.
 */
export async function handleBlockEvent(event: BlockEvent, env: Bindings): Promise<void> {
  const db = createDb(env.DATABASE_URL);
  const { pageId } = event.payload;

  switch (event.type) {
    case 'block.created':
    case 'block.updated':
    case 'block.deleted': {
      const updated = await db
        .update(pages)
        .set({ updatedAt: new Date() })
        .where(eq(pages.id, pageId))
        .returning();

      if (updated.length) {
        console.log(`[block-service] ${event.type}: touched updatedAt for page ${pageId}`);
      } else {
        console.warn(`[block-service] ${event.type}: page ${pageId} not found — skipped touch`);
      }
      break;
    }
  }
}
