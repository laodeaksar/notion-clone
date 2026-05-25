import * as v from 'valibot';
import { BlockInputSchema, BlockUpdateSchema } from '../types/block.types';
import { createBlockRepo } from '../repository/block.repo';
import { publisher } from '../events/publisher';
import type { Db } from '@workspace/db';
import type { Block } from '../types/block.types';

export function createBlockService(db: Db) {
  const blockRepo = createBlockRepo(db);

  return {
    async getBlocksByPage(pageId: string): Promise<Block[]> {
      return blockRepo.findByPageId(pageId);
    },

    async getBlockById(id: string): Promise<Block | null> {
      return blockRepo.findById(id);
    },

    async createBlock(input: v.InferInput<typeof BlockInputSchema>): Promise<Block> {
      const block = await blockRepo.create(input);
      await publisher.publish({
        type: 'block.created',
        payload: { blockId: block.id, pageId: block.pageId }
      });
      return block;
    },

    async updateBlock(id: string, input: v.InferInput<typeof BlockUpdateSchema>): Promise<Block | null> {
      const block = await blockRepo.update(id, input);
      if (block) {
        await publisher.publish({
          type: 'block.updated',
          payload: { blockId: block.id, pageId: block.pageId }
        });
      }
      return block;
    },

    async deleteBlock(id: string): Promise<boolean> {
      const existing = await blockRepo.findById(id);
      if (!existing) return false;
      const deleted = await blockRepo.delete(id);
      if (deleted) {
        await publisher.publish({
          type: 'block.deleted',
          payload: { blockId: id, pageId: existing.pageId }
        });
      }
      return deleted;
    }
  };
}
