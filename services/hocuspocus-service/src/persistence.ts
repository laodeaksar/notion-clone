import * as Y from 'yjs';
import { createDb, documents, eq } from '@workspace/db';

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return createDb(url);
}

export async function loadDocument(name: string): Promise<Uint8Array | null> {
  try {
    const db = getDb();
    const rows = await db
      .select({ state: documents.state })
      .from(documents)
      .where(eq(documents.name, name))
      .limit(1);

    if (!rows.length || !rows[0].state) return null;
    return Buffer.from(rows[0].state, 'base64');
  } catch (err) {
    console.error(`[hocuspocus] Failed to load document "${name}":`, err);
    return null;
  }
}

export async function storeDocument(name: string, doc: Y.Doc): Promise<void> {
  try {
    const db = getDb();
    const state = Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64');
    await db
      .insert(documents)
      .values({ name, state, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: documents.name,
        set: { state, updatedAt: new Date() }
      });
  } catch (err) {
    console.error(`[hocuspocus] Failed to store document "${name}":`, err);
  }
}
