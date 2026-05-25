import * as v from 'valibot';

// ─── Block Events ─────────────────────────────────────────────────────────────

export const BlockCreatedPayloadSchema = v.object({
  blockId: v.string(),
  pageId:  v.string()
});

export const BlockUpdatedPayloadSchema = v.object({
  blockId: v.string(),
  pageId:  v.string()
});

export const BlockDeletedPayloadSchema = v.object({
  blockId: v.string(),
  pageId:  v.string()
});

export type BlockEvent =
  | { type: 'block.created'; payload: v.InferInput<typeof BlockCreatedPayloadSchema> }
  | { type: 'block.updated'; payload: v.InferInput<typeof BlockUpdatedPayloadSchema> }
  | { type: 'block.deleted'; payload: v.InferInput<typeof BlockDeletedPayloadSchema> };

// ─── Page Events ──────────────────────────────────────────────────────────────

export const PageCreatedPayloadSchema = v.object({
  pageId:   v.string(),
  parentId: v.optional(v.nullable(v.string()))
});

export const PageUpdatedPayloadSchema = v.object({
  pageId: v.string()
});

export const PageDeletedPayloadSchema = v.object({
  pageId: v.string()
});

export type PageEvent =
  | { type: 'page.created'; payload: v.InferInput<typeof PageCreatedPayloadSchema> }
  | { type: 'page.updated'; payload: v.InferInput<typeof PageUpdatedPayloadSchema> }
  | { type: 'page.deleted'; payload: v.InferInput<typeof PageDeletedPayloadSchema> };

// ─── File Events ──────────────────────────────────────────────────────────────

export const FileUploadedPayloadSchema = v.object({
  publicId: v.string(),
  url:      v.string(),
  provider: v.picklist(['cloudinary', 'r2'])
});

export const FileDeletedPayloadSchema = v.object({
  publicId: v.string()
});

export const FileMovedPayloadSchema = v.object({
  oldPublicId: v.string(),
  publicId:    v.string(),
  url:         v.string()
});

export type FileEvent =
  | { type: 'file.uploaded'; payload: v.InferInput<typeof FileUploadedPayloadSchema> }
  | { type: 'file.deleted'; payload: v.InferInput<typeof FileDeletedPayloadSchema> }
  | { type: 'file.moved';   payload: v.InferInput<typeof FileMovedPayloadSchema> };

// ─── Union ────────────────────────────────────────────────────────────────────

export type AppEvent = BlockEvent | PageEvent | FileEvent;

export type EventType = AppEvent['type'];

export type EventPayload<T extends EventType> = Extract<AppEvent, { type: T }>['payload'];
