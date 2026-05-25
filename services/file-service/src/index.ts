import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { routes } from './routes/index';
import type { HonoEnv, Bindings } from './types/env';
import type { CfMessageBatch, FileEvent } from '@workspace/shared';

const app = new Hono<HonoEnv>();

app.use('*', logger());
app.use('*', cors());

app.get('/ping', (c) => {
  const cf = (c.req.raw as any).cf;
  return c.json({
    status:    'ok',
    service:   'file-service',
    version:   '0.0.1',
    region:    cf?.colo ?? 'local',
    timestamp: new Date().toISOString()
  });
});

app.route('/', routes);

app.onError((err, c) => {
  console.error('[file-service] unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default {
  fetch: app.fetch,

  async queue(batch: CfMessageBatch<FileEvent>, _env: Bindings): Promise<void> {
    for (const msg of batch.messages) {
      try {
        const event = msg.body;
        console.log(`[file-service] queue: ${event.type}`, event.payload);
        // TODO: add downstream handlers per event type, e.g.:
        // file.uploaded → generate thumbnail, run malware scan, update storage quota
        // file.deleted  → invalidate CDN cache, reclaim storage quota
        // file.moved    → update all page references to the old URL
        msg.ack();
      } catch (err) {
        console.error('[file-service] queue processing error:', err);
        msg.retry();
      }
    }
  }
};
