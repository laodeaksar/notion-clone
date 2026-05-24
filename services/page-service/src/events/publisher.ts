export type PageEvent =
  | { type: 'page.created'; payload: { pageId: string; parentId?: string | null } }
  | { type: 'page.updated'; payload: { pageId: string } }
  | { type: 'page.deleted'; payload: { pageId: string } };

export const publisher = {
  async publish(event: PageEvent): Promise<void> {
    if (process.env.REDIS_URL) {
      const { Queue } = await import('bullmq');
      const queue = new Queue('page-events', {
        connection: { url: process.env.REDIS_URL }
      });
      await queue.add(event.type, event.payload);
      return;
    }
    console.log('[publisher] event (no Redis configured):', event);
  }
};
