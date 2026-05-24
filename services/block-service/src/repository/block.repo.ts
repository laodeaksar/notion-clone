import { eq, asc } from 'drizzle-orm';
import { db } from '../config';
import { blocks } from '@workspace/db/src/schema';
import type { BlockInput, BlockUpdate, Block } from '../types/block.types';

export const blockRepo = {
  async findByPageId(pageId: string): Promise<Block[]> {
    return db
      .select()
      .from(blocks)
      .where(eq(blocks.pageId, pageId))
      .orderBy(asc(blocks.order)) as Promise<Block[]>;
  },

  async findById(id: string): Promise<Block | null> {
    const rows = await db
      .select()
      .from(blocks)
      .where(eq(blocks.id, id));
    return (rows[0] as Block) ?? null;
  },

  async create(input: BlockInput): Promise<Block> {
    const now = new Date();
    const [block] = await db
      .insert(blocks)
      .values({
        id: input.id ?? crypto.randomUUID(),
        pageId: input.pageId,
        type: input.type,
        content: input.content,
        order: input.order ?? 0,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return block as Block;
  },

  async update(id: string, input: BlockUpdate): Promise<Block | null> {
    const now = new Date();
    const [block] = await db
      .update(blocks)
      .set({ ...input, updatedAt: now })
      .where(eq(blocks.id, id))
      .returning();
    return (block as Block) ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const rows = await db
      .delete(blocks)
      .where(eq(blocks.id, id))
      .returning();
    return rows.length > 0;
  }
};
