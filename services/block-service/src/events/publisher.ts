export type BlockEvent =
  | { type: 'block.created'; payload: { blockId: string; pageId: string } }
  | { type: 'block.updated'; payload: { blockId: string; pageId: string } }
  | { type: 'block.deleted'; payload: { blockId: string; pageId: string } };

/**
 * CF Workers-compatible publisher.
 * Logs events to console. Extend with CF Queues binding when needed:
 *   await env.BLOCK_QUEUE.send(event)
 */
export const publisher = {
  async publish(event: BlockEvent): Promise<void> {
    console.log('[block-events]', JSON.stringify(event));
  }
};
