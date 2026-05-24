export type BlockEvent =
  | { type: 'block.created'; payload: { blockId: string; pageId: string } }
  | { type: 'block.updated'; payload: { blockId: string; pageId: string } }
  | { type: 'block.deleted'; payload: { blockId: string; pageId: string } };

export const publisher = {
  async publish(event: BlockEvent): Promise<void> {
    if (process.env.REDIS_URL) {
      const { Queue } = await import('bullmq');
      const queue = new Queue('block-events', {
        connection: { url: process.env.REDIS_URL }
      });
      await queue.add(event.type, event.payload);
      return;
    }
    console.log('[publisher] event (no Redis configured):', event);
  }
};
