import { pageRepo } from '../repository/page.repo';
import { publisher } from '../events/publisher';
import { PageInputSchema, PageUpdateSchema } from '../types/page.types';
import type { PageInput, PageUpdate, Page } from '../types/page.types';

export const pageService = {
  async getPages(parentId?: string): Promise<Page[]> {
    return pageRepo.findAll(parentId);
  },

  async getPageById(id: string): Promise<Page | null> {
    return pageRepo.findById(id);
  },

  async createPage(input: unknown): Promise<Page> {
    const parsed = PageInputSchema.parse(input) as PageInput;
    const page = await pageRepo.create(parsed);
    await publisher.publish({
      type: 'page.created',
      payload: { pageId: page.id, parentId: page.parentId }
    });
    return page;
  },

  async updatePage(id: string, input: unknown): Promise<Page | null> {
    const parsed = PageUpdateSchema.parse(input) as PageUpdate;
    const page = await pageRepo.update(id, parsed);
    if (page) {
      await publisher.publish({
        type: 'page.updated',
        payload: { pageId: page.id }
      });
    }
    return page;
  },

  async deletePage(id: string): Promise<boolean> {
    const deleted = await pageRepo.delete(id);
    if (deleted) {
      await publisher.publish({
        type: 'page.deleted',
        payload: { pageId: id }
      });
    }
    return deleted;
  }
};
