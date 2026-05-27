import { serve } from '@hono/node-server';
import app from './index';

const PORT = parseInt(process.env.PORT || '8080');

serve({
  fetch: (req) => app.fetch(req, process.env as any),
  port:  PORT
});

console.log(`[api-gateway] listening on http://localhost:${PORT}`);
