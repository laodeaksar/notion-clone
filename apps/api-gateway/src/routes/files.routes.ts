import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import * as v from 'valibot';
import type { HonoEnv } from '../types/gateway.types';
import { UploadBodySchema } from '../types/gateway.types';
import { getEnv } from '../config';
import { proxyJson } from '../services/proxy.service';
import { requireAuth } from '../middleware/auth';
import { createDb, files, eq, and, lt, or, asc, desc, ilike } from '@workspace/db';

// ─── Patch schema ─────────────────────────────────────────────────────────────
// All fields are optional; at least one must be provided.

const FilePatchSchema = v.pipe(
  v.object({
    name:   v.optional(v.pipe(v.string(), v.minLength(1))),
    folder: v.optional(v.nullable(v.string())),
    pageId: v.optional(v.nullable(v.pipe(v.string(), v.minLength(1)))),
  }),
  v.check(
    (obj) => Object.keys(obj).length > 0,
    'At least one field (name, folder, pageId) must be provided'
  )
);

// ─── Signed-URL helpers ───────────────────────────────────────────────────────
// Short-lived download tokens are HMAC-SHA256 signed with the gateway's
// JWT_SECRET. The message is `fileId|expiresAt` (unix seconds).
// We use base64url so the token is safe in a query-string without encoding.

const DEFAULT_TTL_SECONDS = 15 * 60; // 15 minutes

async function signDownloadToken(
  fileId: string,
  expiresAt: number,
  secret: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const buf = await crypto.subtle.sign(
    'HMAC', key, new TextEncoder().encode(`${fileId}|${expiresAt}`)
  );
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function verifyDownloadToken(
  fileId: string,
  expiresAt: number,
  sig: string,
  secret: string
): Promise<boolean> {
  const expected = await signDownloadToken(fileId, expiresAt, secret);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}

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
 * GET /files/stats
 *
 * Returns aggregate storage statistics queried directly from the DB.
 * All three aggregates run in parallel for minimal latency.
 *
 * Response:
 *   {
 *     totalFiles: number,
 *     totalBytes: number,
 *     byUploader: { uploadedBy: string | null, fileCount: number, totalBytes: number }[],
 *     byPage:     { pageId:     string | null, fileCount: number, totalBytes: number }[]
 *   }
 *
 * byUploader and byPage are sorted by fileCount DESC (busiest first).
 *
 * Errors:
 *   401 — not authenticated
 *   503 — database not configured
 */
fileRoutes.get('/files/stats', requireAuth, async (c) => {
  const dbUrl = getEnv(c, 'DATABASE_URL', '');
  if (!dbUrl) return c.json({ error: 'Database not configured' }, 503);

  const db = createDb(dbUrl);

  // Run all three aggregates concurrently
  const [totalsRows, byUploaderRows, byPageRows] = await Promise.all([
    db.select({
      totalFiles: count(),
      totalBytes: sum(files.size),
    }).from(files),

    db.select({
      uploadedBy: files.uploadedBy,
      fileCount:  count(),
      totalBytes: sum(files.size),
    })
    .from(files)
    .groupBy(files.uploadedBy)
    .orderBy(desc(count())),

    db.select({
      pageId:    files.pageId,
      fileCount: count(),
      totalBytes: sum(files.size),
    })
    .from(files)
    .groupBy(files.pageId)
    .orderBy(desc(count())),
  ]);

  const totals = totalsRows[0];

  return c.json({
    // sum() returns a string from the SQL driver; coerce to number
    totalFiles: totals?.totalFiles ?? 0,
    totalBytes: Number(totals?.totalBytes ?? 0),
    byUploader: byUploaderRows.map((r) => ({
      uploadedBy: r.uploadedBy,
      fileCount:  r.fileCount,
      totalBytes: Number(r.totalBytes ?? 0),
    })),
    byPage: byPageRows.map((r) => ({
      pageId:    r.pageId,
      fileCount: r.fileCount,
      totalBytes: Number(r.totalBytes ?? 0),
    })),
  });
});

/**
 * GET /files/search
 *
 * Full-text search across file `name` and `folder` using Postgres ILIKE.
 * Supports the same optional filters and cursor-based pagination as GET /files.
 *
 * Query params:
 *   q          — search term (required, min 1 char)
 *   uploadedBy — narrow results to a specific uploader
 *   pageId     — narrow results to files attached to a page
 *   cursor     — opaque pagination cursor from a previous response
 *   limit      — page size, 1–200, default 50
 *
 * Response:
 *   { files, nextCursor, count, hasMore, query }
 *
 * Errors:
 *   400 — missing or empty "q"
 *   401 — not authenticated
 *   503 — database not configured
 */
fileRoutes.get('/files/search', requireAuth, async (c) => {
  const q = c.req.query('q')?.trim();
  if (!q) return c.json({ error: 'Missing search query "q"' }, 400);

  const dbUrl = getEnv(c, 'DATABASE_URL', '');
  if (!dbUrl) return c.json({ error: 'Database not configured' }, 503);

  const uploadedBy = c.req.query('uploadedBy') ?? undefined;
  const pageId     = c.req.query('pageId')     ?? undefined;
  const cursorRaw  = c.req.query('cursor')     ?? undefined;
  const limitRaw   = c.req.query('limit');
  const limit      = limitRaw
    ? Math.min(Math.max(parseInt(limitRaw, 10) || 50, 1), 200)
    : 50;

  const cursorParsed = cursorRaw ? decodeCursor(cursorRaw) : null;
  if (cursorRaw && !cursorParsed) return c.json({ error: 'Invalid cursor' }, 400);

  // Escape ILIKE special characters so user input is treated as a literal string.
  // Then wrap in % wildcards for a "contains" match.
  const pattern = `%${q.replace(/[%_\\]/g, '\\$&')}%`;

  const db         = createDb(dbUrl);
  const conditions = [
    // Match either the filename or the folder path
    or(
      ilike(files.name,   pattern),
      ilike(files.folder, pattern)
    )!,
  ];

  if (uploadedBy) conditions.push(eq(files.uploadedBy, uploadedBy));
  if (pageId)     conditions.push(eq(files.pageId, pageId));

  if (cursorParsed) {
    conditions.push(
      or(
        lt(files.createdAt, cursorParsed.createdAt),
        and(
          eq(files.createdAt, cursorParsed.createdAt),
          lt(files.id, cursorParsed.id)
        )
      )!
    );
  }

  const rows = await db
    .select()
    .from(files)
    .where(and(...conditions))
    .orderBy(desc(files.createdAt), asc(files.id))
    .limit(limit + 1);

  const hasMore  = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const lastRow  = pageRows[pageRows.length - 1];
  const nextCursor = hasMore && lastRow
    ? encodeCursor(lastRow.createdAt, lastRow.id)
    : null;

  return c.json({
    files:      pageRows,
    nextCursor,
    count:      pageRows.length,
    hasMore,
    query:      q,
  });
});

/**
 * GET /files/*/url
 *
 * Issues a short-lived signed download URL for any authenticated user.
 * The token is HMAC-SHA256 over `fileId|expiresAt` using JWT_SECRET, so no
 * extra credentials or database writes are required.
 *
 * Query params:
 *   ttl — token lifetime in seconds, 60–86400, default 900 (15 min)
 *
 * Response:
 *   { signedUrl, expiresAt (ISO), expiresIn (seconds) }
 *
 * Errors:
 *   401 — not authenticated
 *   404 — file not found in DB
 *   503 — database not configured
 */
fileRoutes.get('/files/*/url', requireAuth, async (c) => {
  const fileId = c.req.param('*');
  if (!fileId) return c.json({ error: 'Missing file id' }, 400);

  const dbUrl = getEnv(c, 'DATABASE_URL', '');
  if (!dbUrl) return c.json({ error: 'Database not configured' }, 503);

  const db   = createDb(dbUrl);
  const rows = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
  if (!rows[0]) return c.json({ error: 'File not found' }, 404);

  const ttlRaw = c.req.query('ttl');
  const ttl    = ttlRaw
    ? Math.min(Math.max(parseInt(ttlRaw, 10) || DEFAULT_TTL_SECONDS, 60), 86_400)
    : DEFAULT_TTL_SECONDS;

  const secret    = getEnv(c, 'JWT_SECRET', 'dev-secret');
  const expiresAt = Math.floor(Date.now() / 1000) + ttl;
  const sig       = await signDownloadToken(fileId, expiresAt, secret);

  // Build the download URL relative to the gateway so it works in any environment.
  const base       = new URL(c.req.url);
  const signedUrl  = `${base.origin}/files/${fileId}/download?sig=${sig}&expires=${expiresAt}`;

  return c.json({
    signedUrl,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
    expiresIn: ttl,
  });
});

/**
 * GET /files/*/download
 *
 * Token-gated download redirect. Verifies the HMAC signature and expiry issued
 * by GET /files/:id/url, then 302-redirects to the file's actual public URL
 * stored in the database (served directly from R2 — no bandwidth through
 * the gateway).
 *
 * Query params:
 *   sig     — HMAC-SHA256 base64url token
 *   expires — unix timestamp (seconds)
 *
 * Errors:
 *   400 — missing / malformed token params
 *   401 — invalid signature or expired token
 *   404 — file not found in DB
 *   503 — database not configured
 */
fileRoutes.get('/files/*/download', async (c) => {
  const fileId  = c.req.param('*');
  const sig     = c.req.query('sig');
  const expiresStr = c.req.query('expires');

  if (!fileId || !sig || !expiresStr) {
    return c.json({ error: 'Missing token parameters' }, 400);
  }

  const expiresAt = parseInt(expiresStr, 10);
  if (isNaN(expiresAt)) return c.json({ error: 'Invalid expires value' }, 400);

  // Check expiry before any crypto work
  if (Math.floor(Date.now() / 1000) > expiresAt) {
    return c.json({ error: 'Download token has expired' }, 401);
  }

  const secret = getEnv(c, 'JWT_SECRET', 'dev-secret');
  const valid  = await verifyDownloadToken(fileId, expiresAt, sig, secret);
  if (!valid) return c.json({ error: 'Invalid download token' }, 401);

  const dbUrl = getEnv(c, 'DATABASE_URL', '');
  if (!dbUrl) return c.json({ error: 'Database not configured' }, 503);

  const db   = createDb(dbUrl);
  const rows = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
  const file = rows[0] ?? null;

  if (!file) return c.json({ error: 'File not found' }, 404);

  // Redirect to the actual file URL — served directly from R2, zero
  // gateway bandwidth. Swap for a streaming proxy if the bucket is private.
  return c.redirect(file.url, 302);
});

/**
 * GET /files/*
 *
 * Returns a single file's full metadata from the database by its R2 key.
 * Requires authentication; any authenticated user may read any file record.
 *
 * Errors:
 *   401 — not authenticated
 *   404 — file not found in DB
 *   503 — database not configured
 */
fileRoutes.get('/files/*', requireAuth, async (c) => {
  const fileId = c.req.param('*');
  if (!fileId) return c.json({ error: 'Missing file id' }, 400);

  const dbUrl = getEnv(c, 'DATABASE_URL', '');
  if (!dbUrl) return c.json({ error: 'Database not configured' }, 503);

  const db   = createDb(dbUrl);
  const rows = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
  const file = rows[0] ?? null;

  if (!file) return c.json({ error: 'File not found' }, 404);
  return c.json(file);
});

/**
 * DELETE /files/*
 *
 * Deletes a file in two steps (atomic-ish):
 *   1. Ownership check — looks up the file record in the DB; only the uploader
 *      (or any authenticated user when uploadedBy is null) may delete.
 *   2. Proxy DELETE to the file-service — which removes the R2 object, purges
 *      the DB record, and publishes the file.deleted event.
 *
 * The file id is the R2 object key and may contain slashes (e.g. "uploads/uuid.png"),
 * so the route uses a wildcard to capture the full key.
 *
 * Errors:
 *   401 — not authenticated
 *   403 — authenticated but not the file owner
 *   404 — file not found in DB
 *   502/503 — file-service unreachable or returned an unexpected response
 */
fileRoutes.delete('/files/*', requireAuth, async (c) => {
  const fileId = c.req.param('*');
  if (!fileId) return c.json({ error: 'Missing file id' }, 400);

  const dbUrl = getEnv(c, 'DATABASE_URL', '');
  if (!dbUrl) return c.json({ error: 'Database not configured' }, 503);

  // ── 1. Ownership check ────────────────────────────────────────────────────
  const db   = createDb(dbUrl);
  const rows = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
  const file = rows[0] ?? null;

  if (!file) return c.json({ error: 'File not found' }, 404);

  const requesterId = (c.var.jwtPayload as Record<string, unknown>).sub as string | undefined;

  // Only the uploader may delete; if uploadedBy is null (anonymous upload)
  // any authenticated user is allowed.
  if (file.uploadedBy && file.uploadedBy !== requesterId) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  // ── 2. Proxy DELETE to file-service (R2 removal + DB purge + event) ───────
  const fileServiceUrl = getEnv(c, 'FILE_SERVICE_URL', 'http://localhost:8084');
  const authHeader     = c.req.header('authorization') ?? '';

  const { data, status } = await proxyJson(
    fileServiceUrl,
    `/upload/${fileId}`,
    {
      method:  'DELETE',
      headers: { authorization: authHeader },
    }
  );

  return c.json(data, status as any);
});

/**
 * PATCH /files/*
 *
 * Updates mutable file metadata (name, folder, pageId) directly in the DB.
 * Useful for associating a file with a page after it has been uploaded, or
 * renaming/reorganising files without touching R2.
 *
 * Body (at least one field required):
 *   { name?: string, folder?: string | null, pageId?: string | null }
 *
 * Errors:
 *   400 — invalid/empty body
 *   401 — not authenticated
 *   403 — authenticated but not the file owner
 *   404 — file not found in DB
 *   503 — database not configured
 */
fileRoutes.patch('/files/*', requireAuth, async (c) => {
  const fileId = c.req.param('*');
  if (!fileId) return c.json({ error: 'Missing file id' }, 400);

  const dbUrl = getEnv(c, 'DATABASE_URL', '');
  if (!dbUrl) return c.json({ error: 'Database not configured' }, 503);

  // ── 1. Validate body ──────────────────────────────────────────────────────
  const body   = await c.req.json().catch(() => null);
  const parsed = v.safeParse(FilePatchSchema, body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid request body', issues: parsed.issues }, 400);
  }

  // ── 2. Ownership check ────────────────────────────────────────────────────
  const db   = createDb(dbUrl);
  const rows = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
  const file = rows[0] ?? null;

  if (!file) return c.json({ error: 'File not found' }, 404);

  const requesterId = (c.var.jwtPayload as Record<string, unknown>).sub as string | undefined;
  if (file.uploadedBy && file.uploadedBy !== requesterId) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  // ── 3. Apply patch ────────────────────────────────────────────────────────
  // Build a typed patch object from only the fields the caller sent.
  type FilePatch = {
    updatedAt: Date;
    name?:   string;
    folder?: string | null;
    pageId?: string | null;
  };

  const patch: FilePatch = { updatedAt: new Date() };
  if ('name'   in parsed.output) patch.name   = parsed.output.name;
  if ('folder' in parsed.output) patch.folder = parsed.output.folder;
  if ('pageId' in parsed.output) patch.pageId = parsed.output.pageId;

  const [updated] = await db
    .update(files)
    .set(patch)
    .where(eq(files.id, fileId))
    .returning();

  return c.json(updated ?? file);
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
