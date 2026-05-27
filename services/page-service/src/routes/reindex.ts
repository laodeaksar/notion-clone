import { Hono } from 'hono';
import { createDb, pages, blocks, searchIndex } from '@workspace/db';
import type { HonoEnv } from '../types/env';

/**
 * Recursively extract all string leaf-values from an unknown JSONB structure.
 * Only human-readable strings are collected; numbers and booleans are skipped.
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
 * POST /reindex
 *
 * Admin endpoint — rebuilds the entire search_index table by scanning all
 * existing pages and blocks across all users. Protected by x-internal-secret.
 *
 * Returns:
 *   { indexed: { pages: N, blocks: N }, skipped: N, durationMs: N }
 */
export const reindexRoutes = new Hono<HonoEnv>()

  .post('/', async (c) => {
    // Require the internal secret (only the gateway may call this)
    const secret   = c.env.INTERNAL_SECRET ?? '';
    const incoming = c.req.header('x-internal-secret') ?? '';
    if (!secret || incoming !== secret) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const start = Date.now();
    const db    = createDb(c.env.DATABASE_URL);

    let indexedPages  = 0;
    let indexedBlocks = 0;
    let skipped       = 0;

    // ── 1. Index all pages ────────────────────────────────────────────────
    const allPages = await db.select().from(pages);

    for (const page of allPages) {
      try {
        await db
          .insert(searchIndex)
          .values({
            id:         crypto.randomUUID(),
            entityType: 'page',
            entityId:   page.id,
            pageId:     page.id,
            body:       page.title,
            updatedAt:  new Date()
          })
          .onConflictDoUpdate({
            target: searchIndex.entityId,
            set:    { body: page.title, updatedAt: new Date() }
          });
        indexedPages++;
      } catch {
        skipped++;
      }
    }

    // ── 2. Index all blocks ───────────────────────────────────────────────
    const allBlocks = await db.select().from(blocks);

    for (const block of allBlocks) {
      try {
        const body = extractText(block.content).trim();
        if (body) {
          await db
            .insert(searchIndex)
            .values({
              id:         crypto.randomUUID(),
              entityType: 'block',
              entityId:   block.id,
              pageId:     block.pageId,
              body,
              updatedAt:  new Date()
            })
            .onConflictDoUpdate({
              target: searchIndex.entityId,
              set:    { body, updatedAt: new Date() }
            });
          indexedBlocks++;
        } else {
          skipped++;
        }
      } catch {
        skipped++;
      }
    }

    const durationMs = Date.now() - start;

    console.log(
      `[page-service] reindex complete — pages: ${indexedPages}, blocks: ${indexedBlocks},`,
      `skipped: ${skipped}, duration: ${durationMs}ms`
    );

    return c.json({
      indexed:    { pages: indexedPages, blocks: indexedBlocks },
      skipped,
      durationMs
    });
  });
