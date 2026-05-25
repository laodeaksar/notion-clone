import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { routes } from './routes/index';
import type { HonoEnv, Bindings } from './types/env';
import type { CfMessageBatch, BlockEvent } from '@workspace/shared';

const app = new Hono<HonoEnv>();

app.use('*', logger());
app.use('*', cors());

app.get('/ping', (c) => {
  const cf = (c.req.raw as any).cf;
  return c.json({
    status:    'ok',
    service:   'block-service',
    version:   '0.0.1',
    region:    cf?.colo ?? 'local',
    timestamp: new Date().toISOString()
  });
});

app.route('/', routes);

app.onError((err, c) => {
  console.error('[block-service] unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default {
  fetch: app.fetch,

  async queue(batch: CfMessageBatch<BlockEvent>, _env: Bindings): Promise<void> {
    for (const msg of batch.messages) {
      try {
        const event = msg.body;
        console.log(`[block-service] queue: ${event.type}`, event.payload);
        // TODO: add downstream handlers per event type, e.g.:
        // block.created → update page word count / search index
        // block.updated → sync to Hocuspocus real-time server
        // block.deleted → remove from search index, decrement page block count
        msg.ack();
      } catch (err) {
        console.error('[block-service] queue processing error:', err);
        msg.retry();
      }
    }
  }
};
