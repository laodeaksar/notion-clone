import { z } from 'zod';

export const BlockInputSchema = z.object({
  id: z.string().optional(),
  pageId: z.string(),
  type: z.string(),
  content: z.any(),
  order: z.number().optional()
});

export const BlockUpdateSchema = z.object({
  type: z.string().optional(),
  content: z.any().optional(),
  order: z.number().optional()
});

export type BlockInput = z.infer<typeof BlockInputSchema>;
export type BlockUpdate = z.infer<typeof BlockUpdateSchema>;

export type Block = {
  id: string;
  pageId: string;
  type: string;
  content: unknown;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};
