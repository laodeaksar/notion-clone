export type PageEvent =
  | { type: 'page.created'; payload: { pageId: string; parentId?: string | null } }
  | { type: 'page.updated'; payload: { pageId: string } }
  | { type: 'page.deleted'; payload: { pageId: string } };

/**
 * CF Workers-compatible publisher.
 * Logs events to console. Extend with CF Queues binding when needed:
 *   await env.PAGE_QUEUE.send(event)
 */
export const publisher = {
  async publish(event: PageEvent): Promise<void> {
    console.log('[page-events]', JSON.stringify(event));
  }
};
