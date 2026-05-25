import type { AppEvent } from './events';
import type { Queue } from 'bullmq'; // import type only, no runtime cost

export type Publisher<T extends AppEvent> = {
  publish(event: T): Promise<void>;
};

/**
 * Creates a typed publisher bound to a specific BullMQ queue name.
 * - If REDIS_URL is set → enqueues into BullMQ
 * - Otherwise          → logs to console (dev fallback)
 */
export function createPublisher<T extends AppEvent>(queueName: string): Publisher<T> {
  return {
    async publish(event: T): Promise<void> {
      if (process.env.REDIS_URL) {
        const { Queue: BullQueue } = await import('bullmq');
        const queue: Queue = new BullQueue(queueName, {
          connection: { url: process.env.REDIS_URL }
        });
        await queue.add(event.type, event.payload);
        await queue.close(); // close connection after job is added
        return;
      }
      console.log(`[${queueName}] event (no Redis configured):`, event);
    }
  };
}
