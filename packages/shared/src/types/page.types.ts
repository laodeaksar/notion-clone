import * as v from 'valibot';

export const PageInputSchema = v.object({
  title:    v.pipe(v.string(), v.minLength(1)),
  parentId: v.optional(v.nullable(v.string()))
});

export const PageUpdateSchema = v.object({
  title:    v.optional(v.pipe(v.string(), v.minLength(1))),
  parentId: v.optional(v.nullable(v.string()))
});

export type PageInput  = v.InferInput<typeof PageInputSchema>;
export type PageUpdate = v.InferInput<typeof PageUpdateSchema>;

export type Page = {
  id:        string;
  title:     string;
  parentId:  string | null;
  createdAt: Date;
  updatedAt: Date;
};
