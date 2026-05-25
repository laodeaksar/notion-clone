import { createDb, documents, eq } from '@workspace/db';

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return createDb(url);
}

export async function fetchDocument(documentName: string): Promise<Uint8Array | null> {
  try {
    const db = getDb();
    const rows = await db
      .select({ state: documents.state })
      .from(documents)
      .where(eq(documents.name, documentName))
      .limit(1);

    if (!rows.length || !rows[0].state) return null;
    return Buffer.from(rows[0].state, 'base64');
  } catch (err) {
    console.error(`[hocuspocus:db] Failed to fetch "${documentName}":`, err);
    return null;
  }
}

export async function storeDocument(documentName: string, state: Uint8Array): Promise<void> {
  try {
    const db = getDb();
    const encoded = Buffer.from(state).toString('base64');
    await db
      .insert(documents)
      .values({ name: documentName, state: encoded, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: documents.name,
        set: { state: encoded, updatedAt: new Date() }
      });
  } catch (err) {
    console.error(`[hocuspocus:db] Failed to store "${documentName}":`, err);
  }
}
