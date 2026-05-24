import { z } from 'zod';

export const PageInputSchema = z.object({
  title: z.string().min(1),
  parentId: z.string().nullable().optional()
});

export const PageUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  parentId: z.string().nullable().optional()
});

export type PageInput = z.infer<typeof PageInputSchema>;
export type PageUpdate = z.infer<typeof PageUpdateSchema>;

export type Page = {
  id: string;
  title: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};
