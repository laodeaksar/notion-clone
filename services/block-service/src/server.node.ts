import { serve } from '@hono/node-server';
import handler from './index';

const PORT = parseInt(process.env.PORT || '8081');

serve({
  fetch: (req) => handler.fetch(req, process.env as any),
  port:  PORT
});

console.log(`[block-service] listening on http://localhost:${PORT}`);
