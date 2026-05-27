import { createDb, pages, blocks, eq } from '@workspace/db';
import { indexBlock, cleanBlockIndex } from '../services/search.indexer';
import type { BlockEvent } from '@workspace/shared';
import type { Bindings } from '../types/env';

/**
 * Handles incoming BlockEvents from the Cloudflare Queue.
 *
 * block.created → touches parent page updatedAt + upserts block text into search_index.
 * block.updated → touches parent page updatedAt + refreshes block text in search_index.
 * block.deleted → touches parent page updatedAt + removes block from search_index.
 */
export async function handleBlockEvent(event: BlockEvent, env: Bindings): Promise<void> {
  const db = createDb(env.DATABASE_URL);
  const { blockId, pageId } = event.payload;

  switch (event.type) {
    case 'block.created':
    case 'block.updated': {
      // Touch the parent page so clients see an updated "last modified" timestamp
      const updated = await db
        .update(pages)
        .set({ updatedAt: new Date() })
        .where(eq(pages.id, pageId))
        .returning();

      if (!updated.length) {
        console.warn(`[block-service] ${event.type}: page ${pageId} not found — skipped touch`);
      }

      // Fetch block and index its text content
      const [block] = await db.select().from(blocks).where(eq(blocks.id, blockId));
      if (block) {
        await indexBlock(db, blockId, pageId, block.content);
        console.log(`[block-service] ${event.type}: indexed block ${blockId} on page ${pageId}`);
      }
      break;
    }

    case 'block.deleted': {
      // Touch parent page
      await db
        .update(pages)
        .set({ updatedAt: new Date() })
        .where(eq(pages.id, pageId))
        .returning();

      // Remove the block's search index entry
      await cleanBlockIndex(db, blockId);

      console.log(`[block-service] block.deleted: removed block ${blockId} from page ${pageId}`);
      break;
    }
  }
}
