import { Elysia } from 'elysia';
import { blockService } from '../services/block.service';

export const blockRoutes = new Elysia({ prefix: '/blocks' })
  .get('/', async ({ query, set }) => {
    const pageId = (query as Record<string, string>).pageId;
    if (!pageId) {
      set.status = 400;
      return { error: 'pageId is required' };
    }
    const blocks = await blockService.getBlocksByPage(pageId);
    return { blocks };
  })

  .get('/:id', async ({ params, set }) => {
    const block = await blockService.getBlockById(params.id);
    if (!block) {
      set.status = 404;
      return { error: 'Block not found' };
    }
    return { block };
  })

  .post('/', async ({ body, set }) => {
    try {
      const block = await blockService.createBlock(body);
      set.status = 201;
      return { status: 'created', block };
    } catch (err: any) {
      set.status = 400;
      return { error: err.message ?? 'Invalid input' };
    }
  })

  .put('/:id', async ({ params, body, set }) => {
    try {
      const block = await blockService.updateBlock(params.id, body);
      if (!block) {
        set.status = 404;
        return { error: 'Block not found' };
      }
      return { block };
    } catch (err: any) {
      set.status = 400;
      return { error: err.message ?? 'Invalid input' };
    }
  })

  .delete('/:id', async ({ params, set }) => {
    const deleted = await blockService.deleteBlock(params.id);
    if (!deleted) {
      set.status = 404;
      return { error: 'Block not found' };
    }
    return { deleted: true };
  });
