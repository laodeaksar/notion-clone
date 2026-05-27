import { searchIndex, eq } from '@workspace/db';
import type { Db } from '@workspace/db';

/**
 * Recursively extract all string leaf-values from an unknown JSONB structure.
 * Numbers and booleans are intentionally skipped — we only want human-readable text.
 *
 * Examples:
 *   { level: 1, text: "Hello" }               → "Hello"
 *   { content: [{ text: "A" }, { text: "B" }] } → "A B"
 */
export function extractText(value: unknown): string {
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
 * Upsert extracted block text into search_index, or remove the entry if the
 * block has no human-readable text (e.g. an image block).
 * Called directly after create/update so search works without a Queue consumer.
 */
export async function indexBlock(
  db: Db,
  blockId: string,
  pageId: string,
  content: unknown
): Promise<void> {
  const body = extractText(content).trim();
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
  } else {
    await db.delete(searchIndex).where(eq(searchIndex.entityId, blockId));
  }
}

/**
 * Remove a block's search_index entry.
 * Called directly after delete so the index stays clean without a Queue consumer.
 */
export async function cleanBlockIndex(db: Db, blockId: string): Promise<void> {
  await db.delete(searchIndex).where(eq(searchIndex.entityId, blockId));
}
