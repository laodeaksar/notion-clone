import { blockRepo } from '../repository/block.repo';
import { publisher } from '../events/publisher';
import { BlockInputSchema, BlockUpdateSchema } from '../types/block.types';
import type { BlockInput, BlockUpdate, Block } from '../types/block.types';

export const blockService = {
  async getBlocksByPage(pageId: string): Promise<Block[]> {
    if (!pageId) throw new Error('pageId is required');
    return blockRepo.findByPageId(pageId);
  },

  async getBlockById(id: string): Promise<Block | null> {
    return blockRepo.findById(id);
  },

  async createBlock(input: unknown): Promise<Block> {
    const parsed = BlockInputSchema.parse(input) as BlockInput;
    const block = await blockRepo.create(parsed);
    await publisher.publish({
      type: 'block.created',
      payload: { blockId: block.id, pageId: block.pageId }
    });
    return block;
  },

  async updateBlock(id: string, input: unknown): Promise<Block | null> {
    const parsed = BlockUpdateSchema.parse(input) as BlockUpdate;
    const block = await blockRepo.update(id, parsed);
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
