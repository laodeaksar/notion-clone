import { Hono } from 'hono';
import type { HonoEnv } from '../types/gateway.types';
import { authRoutes }   from './auth.routes';
import { pageRoutes }   from './pages.routes';
import { fileRoutes }   from './files.routes';
import { docsRoutes }   from './docs.routes';
import { searchRoutes } from './search.routes';
import { adminRoutes }  from './admin.routes';

export function registerRoutes(app: Hono<HonoEnv>) {
  app.route('/', docsRoutes);
  app.route('/', authRoutes);
  app.route('/', pageRoutes);
  app.route('/', fileRoutes);
  app.route('/', searchRoutes);
  app.route('/', adminRoutes);
  app.all('*', (c) => c.json({ error: 'not found' }, 404));
}
