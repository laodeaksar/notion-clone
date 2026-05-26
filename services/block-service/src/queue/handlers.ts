import { createDb, pages, blocks, searchIndex, eq } from '@workspace/db';
import type { BlockEvent } from '@workspace/shared';
import type { Bindings } from '../types/env';

/**
 * Recursively extract all string leaf-values from an unknown JSONB structure.
 * Numbers and booleans are intentionally skipped — we only want human-readable text.
 *
 * Examples:
 *   { level: 1, text: "Hello" }              → "Hello"
 *   { content: [{ text: "A" }, { text: "B" }] } → "A B"
 */
function extractText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value.map(extractText).filter(Boolean).join(' ');
  }
  if (value !== null && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map(extractText)
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

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

      // Fetch block content and upsert extracted text into the search index
      const [block] = await db.select().from(blocks).where(eq(blocks.id, blockId));
      if (block) {
        const body = extractText(block.content).trim();
        if (body) {
          await db
            .insert(searchIndex)
            .values({
              id:         crypto.randomUUID(),
              entityType: 'block',
              entityId:   blockId,
              pageId,
              body,
              updatedAt:  new Date()
            })
            .onConflictDoUpdate({
              target: searchIndex.entityId,
              set:    { body, updatedAt: new Date() }
            });
          console.log(`[block-service] ${event.type}: indexed block ${blockId} on page ${pageId}`);
        } else {
          // Block has no extractable text (e.g. an image block) — remove stale entry if any
          await db.delete(searchIndex).where(eq(searchIndex.entityId, blockId));
          console.log(`[block-service] ${event.type}: block ${blockId} has no text body — removed from index`);
        }
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
      const removed = await db
        .delete(searchIndex)
        .where(eq(searchIndex.entityId, blockId))
        .returning();

      console.log(
        `[block-service] block.deleted: removed block ${blockId} from page ${pageId}`,
        removed.length ? '(search entry deleted)' : '(no search entry found)'
      );
      break;
    }
  }
}
