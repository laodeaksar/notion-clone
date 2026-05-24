export type FileEvent = {
  type: 'file.uploaded';
  payload: {
    publicId: string;
    url: string;
    provider: 'cloudinary' | 'local';
  };
};

export const publisher = {
  async publish(event: FileEvent): Promise<void> {
    if (process.env.REDIS_URL) {
      const { Queue } = await import('bullmq');
      const queue = new Queue('file-events', {
        connection: { url: process.env.REDIS_URL }
      });
      await queue.add(event.type, event.payload);
      return;
    }
    console.log('[publisher] event (no Redis configured):', event);
  }
};
