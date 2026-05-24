export type FileEvent = {
  type: 'file.uploaded';
  payload: { publicId: string; url: string; provider: 'cloudinary' | 'local' };
};

/**
 * CF Workers-compatible publisher.
 * Logs events to console. Extend with CF Queues binding when needed:
 *   await env.FILE_QUEUE.send(event)
 */
export const publisher = {
  async publish(event: FileEvent): Promise<void> {
    console.log('[file-events]', JSON.stringify(event));
  }
};
