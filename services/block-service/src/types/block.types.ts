import * as v from 'valibot';

export const BlockInputSchema = v.object({
  id: v.optional(v.string()),
  pageId: v.string(),
  type: v.string(),
  content: v.unknown(),
  order: v.optional(v.number())
});

export const BlockUpdateSchema = v.object({
  type: v.optional(v.string()),
  content: v.optional(v.unknown()),
  order: v.optional(v.number())
});

export type BlockInput  = v.InferInput<typeof BlockInputSchema>;
export type BlockUpdate = v.InferInput<typeof BlockUpdateSchema>;

export type Block = {
  id: string;
  pageId: string;
  type: string;
  content: unknown;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};
