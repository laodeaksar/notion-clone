import { z } from 'zod';

// ─── Block Events ─────────────────────────────────────────────────────────────

export const BlockCreatedPayloadSchema = z.object({
  blockId: z.string(),
  pageId: z.string()
});

export const BlockUpdatedPayloadSchema = z.object({
  blockId: z.string(),
  pageId: z.string()
});

export const BlockDeletedPayloadSchema = z.object({
  blockId: z.string(),
  pageId: z.string()
});

export type BlockEvent =
  | { type: 'block.created'; payload: z.infer<typeof BlockCreatedPayloadSchema> }
  | { type: 'block.updated'; payload: z.infer<typeof BlockUpdatedPayloadSchema> }
  | { type: 'block.deleted'; payload: z.infer<typeof BlockDeletedPayloadSchema> };

// ─── Page Events ──────────────────────────────────────────────────────────────

export const PageCreatedPayloadSchema = z.object({
  pageId: z.string(),
  parentId: z.string().nullable().optional()
});

export const PageUpdatedPayloadSchema = z.object({
  pageId: z.string()
});

export const PageDeletedPayloadSchema = z.object({
  pageId: z.string()
});

export type PageEvent =
  | { type: 'page.created'; payload: z.infer<typeof PageCreatedPayloadSchema> }
  | { type: 'page.updated'; payload: z.infer<typeof PageUpdatedPayloadSchema> }
  | { type: 'page.deleted'; payload: z.infer<typeof PageDeletedPayloadSchema> };

// ─── File Events ──────────────────────────────────────────────────────────────

export const FileUploadedPayloadSchema = z.object({
  publicId: z.string(),
  url: z.string(),
  provider: z.enum(['r2'])
});

export const FileDeletedPayloadSchema = z.object({
  publicId: z.string()
});

export type FileEvent =
  | { type: 'file.uploaded'; payload: z.infer<typeof FileUploadedPayloadSchema> }
  | { type: 'file.deleted'; payload: z.infer<typeof FileDeletedPayloadSchema> };

// ─── Union ────────────────────────────────────────────────────────────────────

export type AppEvent = BlockEvent | PageEvent | FileEvent;

export type EventType = AppEvent['type'];

export type EventPayload<T extends EventType> = Extract<
  AppEvent,
  { type: T }
>['payload'];
