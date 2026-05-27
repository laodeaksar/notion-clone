import * as v from 'valibot';
import { blocks } from '@workspace/db';
import { PageInputSchema, PageUpdateSchema } from '../types/page.types';
import { createPageRepo } from '../repository/page.repo';
import { createPagePublisher } from '../events/publisher';
import { indexPage, cleanPageIndex } from './search.indexer';
import type { CfQueue } from '@workspace/shared';
import type { PageEvent } from '@workspace/shared';
import type { Db } from '@workspace/db';
import type { Page } from '../types/page.types';

export function createPageService(db: Db, eventsQueue?: CfQueue<PageEvent> | null) {
  const pageRepo  = createPageRepo(db);
  const publisher = createPagePublisher(eventsQueue);

  return {
    async getPages(userId: string, parentId?: string): Promise<Page[]> {
      return pageRepo.findAll(userId, parentId);
    },

    async getPageById(id: string, userId: string): Promise<Page | null> {
      return pageRepo.findById(id, userId);
    },

    /**
     * Returns ancestor pages in root-first order using a single recursive CTE.
     */
    async getAncestors(id: string, userId: string): Promise<Page[]> {
      return pageRepo.findAncestors(id, userId);
    },

    async createPage(input: v.InferInput<typeof PageInputSchema>, userId: string): Promise<Page> {
      const page = await pageRepo.create(input, userId);

      // Insert a default empty heading block immediately (Queue may not be consumed in dev)
      await db
        .insert(blocks)
        .values({
          id:        crypto.randomUUID(),
          pageId:    page.id,
          type:      'heading',
          content:   { level: 1, text: '' },
          order:     0,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .onConflictDoNothing();

      // Index and publish in parallel; errors are non-fatal
      await Promise.allSettled([
        publisher.publish({ type: 'page.created', payload: { pageId: page.id, parentId: page.parentId } }),
        indexPage(db, page.id)
      ]);

      return page;
    },

    async updatePage(
      id: string,
      input: v.InferInput<typeof PageUpdateSchema>,
      userId: string
    ): Promise<Page | null> {
      const page = await pageRepo.update(id, input, userId);
      if (page) {
        await Promise.allSettled([
          publisher.publish({ type: 'page.updated', payload: { pageId: page.id } }),
          indexPage(db, page.id)
        ]);
      }
      return page;
    },

    async deletePage(id: string, userId: string): Promise<boolean> {
      const deleted = await pageRepo.delete(id, userId);
      if (deleted) {
        await Promise.allSettled([
          publisher.publish({ type: 'page.deleted', payload: { pageId: id } }),
          cleanPageIndex(db, id)
        ]);
      }
      return deleted;
    }
  };
}
