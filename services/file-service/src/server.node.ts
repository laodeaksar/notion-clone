import { serve } from '@hono/node-server';
import handler from './index';

const PORT = parseInt(process.env.PORT || '8084');

serve({
  fetch: (req) => handler.fetch(req, process.env as any),
  port:  PORT
});

console.log(`[file-service] listening on http://localhost:${PORT}`);
