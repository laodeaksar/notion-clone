import { serve } from '@hono/node-server';
import app from './index';

const PORT = parseInt(process.env.PORT || '8083');

serve({
  fetch: (req) => app.fetch(req, process.env as any),
  port:  PORT
});

console.log(`[auth-service] listening on http://localhost:${PORT}`);
