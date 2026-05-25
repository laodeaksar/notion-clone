import { eq } from '@workspace/db';
import { files } from '@workspace/db';
import type { Db } from '@workspace/db';
import type { FileRecord } from '../types/file.types';

export function createFileRepo(db: Db) {
  return {
    async findById(id: string): Promise<FileRecord | null> {
      const rows = await db.select().from(files).where(eq(files.id, id));
      return (rows[0] as FileRecord) ?? null;
    },

    async create(record: Omit<FileRecord, 'createdAt' | 'updatedAt'>): Promise<FileRecord> {
      const now = new Date();
      const [file] = await db
        .insert(files)
        .values({ ...record, createdAt: now, updatedAt: now })
        .returning();
      return file as FileRecord;
    },

    async move(oldId: string, newId: string, newUrl: string): Promise<FileRecord | null> {
      const existing = await this.findById(oldId);
      if (!existing) return null;
      const now = new Date();
      // Delete old record, insert new one with updated id/url
      await db.delete(files).where(eq(files.id, oldId));
      const [file] = await db
        .insert(files)
        .values({ ...existing, id: newId, url: newUrl, updatedAt: now })
        .returning();
      return file as FileRecord;
    },

    async delete(id: string): Promise<boolean> {
      const rows = await db.delete(files).where(eq(files.id, id)).returning();
      return rows.length > 0;
    }
  };
}
