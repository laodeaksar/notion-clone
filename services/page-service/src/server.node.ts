import { serve } from '@hono/node-server';
import handler from './index';

const PORT = parseInt(process.env.PORT || '8082');

serve({
  fetch: (req) => handler.fetch(req, process.env as any),
  port:  PORT
});

console.log(`[page-service] listening on http://localhost:${PORT}`);
