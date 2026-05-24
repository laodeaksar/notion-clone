import { Elysia } from 'elysia';
import { pageService } from '../services/page.service';

export const pageRoutes = new Elysia({ prefix: '/pages' })
  .get('/', async ({ query }) => {
    const parentId = (query as Record<string, string>).parentId;
    const pages = await pageService.getPages(parentId);
    return { pages };
  })

  .post('/', async ({ body, set }) => {
    try {
      const page = await pageService.createPage(body);
      set.status = 201;
      return { page };
    } catch (err: any) {
      set.status = 400;
      return { error: err.message ?? 'Invalid input' };
    }
  })

  .get('/:id', async ({ params, set }) => {
    const page = await pageService.getPageById(params.id);
    if (!page) {
      set.status = 404;
      return { error: 'Page not found' };
    }
    return { page };
  })

  .put('/:id', async ({ params, body, set }) => {
    try {
      const page = await pageService.updatePage(params.id, body);
      if (!page) {
        set.status = 404;
        return { error: 'Page not found' };
      }
      return { page };
    } catch (err: any) {
      set.status = 400;
      return { error: err.message ?? 'Invalid input' };
    }
  })

  .delete('/:id', async ({ params, set }) => {
    const deleted = await pageService.deletePage(params.id);
    if (!deleted) {
      set.status = 404;
      return { error: 'Page not found' };
    }
    return { deleted: true };
  });
