import type { AppEvent } from './events';
import type { Queue } from 'bullmq'; // import type only, no runtime cost

// ─── Cloudflare Queues types ──────────────────────────────────────────────────
// Minimal interfaces that mirror the CF Queues runtime API.
// Defined here to avoid a hard @cloudflare/workers-types dependency in every
// package that imports @workspace/shared.

export interface CfQueue<T = unknown> {
  send(
    message: T,
    options?: { contentType?: 'text' | 'bytes' | 'json' | 'v8'; delaySeconds?: number }
  ): Promise<void>;
  sendBatch(
    messages: Iterable<{ body: T; contentType?: string; delaySeconds?: number }>,
    options?: { delaySeconds?: number }
  ): Promise<void>;
}

export interface CfMessage<T = unknown> {
  readonly id: string;
  readonly timestamp: Date;
  readonly body: T;
  ack(): void;
  retry(options?: { delaySeconds?: number }): void;
}

export interface CfMessageBatch<T = unknown> {
  readonly queue: string;
  readonly messages: readonly CfMessage<T>[];
  ackAll(): void;
  retryAll(options?: { delaySeconds?: number }): void;
}

// ─── Publisher ────────────────────────────────────────────────────────────────

export type Publisher<T extends AppEvent> = {
  publish(event: T): Promise<void>;
};

/**
 * Creates a typed event publisher backed by a Cloudflare Queue binding.
 *
 * - If `queue` is provided → sends the event as JSON to the CF Queue.
 * - If `queue` is null/undefined → logs to console (local dev fallback).
 *
 * The `queue` binding must come from the Worker's `env` object (Bindings).
 * It is never available at module init time — always pass it at call time
 * via the service factory, e.g. `createPageService(db, c.env.EVENTS_QUEUE)`.
 */
export function createPublisher<T extends AppEvent>(
  queue: CfQueue<T> | null | undefined
): Publisher<T> {
  return {
    async publish(event: T): Promise<void> {
<<<<<<< HEAD
      if (process.env.REDIS_URL) {
        const { Queue: BullQueue } = await import('bullmq');
        const queue: Queue = new BullQueue(queueName, {
          connection: { url: process.env.REDIS_URL }
        });
        await queue.add(event.type, event.payload);
        await queue.close(); // close connection after job is added
=======
      if (queue) {
        await queue.send(event, { contentType: 'json' });
>>>>>>> ccd8743 (Integrate Cloudflare Queues for event publishing across services)
        return;
      }
      console.log('[events] (no EVENTS_QUEUE binding — console fallback):', event);
    }
  };
}
