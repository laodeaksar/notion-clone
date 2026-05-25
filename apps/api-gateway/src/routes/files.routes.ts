import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import type { HonoEnv } from '../types/gateway.types';
import { UploadBodySchema } from '../types/gateway.types';
import { getEnv } from '../config';
import { proxyJson } from '../services/proxy.service';
import { requireAuth } from '../middleware/auth';
import { createDb, files, eq, and, lt, or, asc, desc } from '@workspace/db';

// ─── Cursor helpers ───────────────────────────────────────────────────────────
// Cursor encodes the last item's (createdAt ISO string + "|" + id) in base64url
// so it is opaque to clients and can evolve without breaking old cursors.
// Uses btoa/atob — safe in both Cloudflare Workers and Node (all chars are ASCII).

function encodeCursor(createdAt: Date, id: string): string {
  return btoa(`${createdAt.toISOString()}|${id}`)
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    // Restore standard base64 padding
    const padded = cursor.replace(/-/g, '+').replace(/_/g, '/');
    const raw    = atob(padded);
    const pivot  = raw.lastIndexOf('|');
    if (pivot === -1) return null;
    const ts = raw.slice(0, pivot);
    const id = raw.slice(pivot + 1);
    const d  = new Date(ts);
    if (isNaN(d.getTime()) || !id) return null;
    return { createdAt: d, id };
  } catch {
    return null;
  }
}

// ─── Route helpers ────────────────────────────────────────────────────────────

const onInvalid = (result: any, c: any) => {
  if (!result.success) {
    return c.json({ error: 'Invalid input', issues: result.issues }, 400);
  }
};

// ─── Router ───────────────────────────────────────────────────────────────────

export const fileRoutes = new Hono<HonoEnv>();

/**
 * GET /files
 *
 * Lists files from the database with optional filters and cursor-based pagination.
 *
 * Query params:
 *   uploadedBy  — filter by uploader user ID
 *   pageId      — filter by associated page ID
 *   cursor      — opaque pagination cursor (from previous response's `nextCursor`)
 *   limit       — page size, 1–200, default 50
 *
 * Response:
 *   { files: FileRow[], nextCursor: string | null, total: number }
 */
fileRoutes.get('/files', requireAuth, async (c) => {
  const dbUrl = getEnv(c, 'DATABASE_URL', '');
  if (!dbUrl) return c.json({ error: 'Database not configured' }, 503);

  const uploadedBy  = c.req.query('uploadedBy')  ?? undefined;
  const pageId      = c.req.query('pageId')       ?? undefined;
  const cursorRaw   = c.req.query('cursor')       ?? undefined;
  const limitRaw    = c.req.query('limit');
  const limit       = limitRaw
    ? Math.min(Math.max(parseInt(limitRaw, 10) || 50, 1), 200)
    : 50;

  // Decode cursor
  const cursorParsed = cursorRaw ? decodeCursor(cursorRaw) : null;
  if (cursorRaw && !cursorParsed) {
    return c.json({ error: 'Invalid cursor' }, 400);
  }

  const db = createDb(dbUrl);

  // Build WHERE conditions
  const conditions = [];

  if (uploadedBy) conditions.push(eq(files.uploadedBy, uploadedBy));
  if (pageId)     conditions.push(eq(files.pageId, pageId));

  // Cursor pagination: fetch rows older than the cursor's createdAt,
  // or same createdAt but with id > cursorId (secondary sort tiebreak).
  // Primary sort: createdAt DESC  →  "older" means createdAt < cursorCreatedAt
  if (cursorParsed) {
    conditions.push(
      or(
        lt(files.createdAt, cursorParsed.createdAt),
        and(
          eq(files.createdAt, cursorParsed.createdAt),
          // id is a UUID/string — lexicographic comparison works as tiebreak
          lt(files.id, cursorParsed.id)
        )
      )!
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Fetch limit + 1 to detect whether a next page exists
  const rows = await db
    .select()
    .from(files)
    .where(where)
    .orderBy(desc(files.createdAt), asc(files.id))
    .limit(limit + 1);

  const hasMore   = rows.length > limit;
  const pageRows  = hasMore ? rows.slice(0, limit) : rows;
  const lastRow   = pageRows[pageRows.length - 1];
  const nextCursor = hasMore && lastRow
    ? encodeCursor(lastRow.createdAt, lastRow.id)
    : null;

  return c.json({
    files:      pageRows,
    nextCursor,
    count:      pageRows.length,
    hasMore,
  });
});

/**
 * POST /upload  — proxies to the file-service (unchanged)
 */
fileRoutes.post(
  '/upload',
  vValidator('json', UploadBodySchema, onInvalid),
  async (c) => {
    const body    = c.req.valid('json');
    const fileUrl = getEnv(c, 'FILE_SERVICE_URL', 'http://localhost:8084');
    const { data, status } = await proxyJson(fileUrl, '/upload', {
      method:  'POST',
      body:    JSON.stringify(body),
      headers: { 'content-type': 'application/json' }
    });
    return c.json(data, status as any);
  }
);
