import { eq, sql } from '@workspace/db';
import { userStorageQuotas } from '@workspace/db';
import type { Db } from '@workspace/db';

export type QuotaRecord = {
  userId:      string;
  usedBytes:   number;
  limitBytes:  number;
  updatedAt:   Date;
};

export function createQuotaRepo(db: Db) {
  return {
    async get(userId: string): Promise<QuotaRecord | null> {
      const rows = await db
        .select()
        .from(userStorageQuotas)
        .where(eq(userStorageQuotas.userId, userId));
      return (rows[0] as QuotaRecord) ?? null;
    },

    async upsertAdd(userId: string, limitBytes: number, deltaBytes: number): Promise<QuotaRecord> {
      const now = new Date();
      const [row] = await db
        .insert(userStorageQuotas)
        .values({
          userId,
          usedBytes:  deltaBytes > 0 ? deltaBytes : 0,
          limitBytes,
          updatedAt:  now
        })
        .onConflictDoUpdate({
          target: userStorageQuotas.userId,
          set: {
            usedBytes: sql`GREATEST(0, ${userStorageQuotas.usedBytes} + ${deltaBytes})`,
            updatedAt: now
          }
        })
        .returning();
      return row as QuotaRecord;
    }
  };
}
