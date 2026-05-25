import * as v from 'valibot';

export const UploadInputSchema = v.object({
  data: v.pipe(v.string(), v.minLength(1)),
  filename: v.optional(v.string()),
  folder: v.optional(v.string())
});

export type UploadInput = v.InferInput<typeof UploadInputSchema>;

export type UploadResult = {
  url: string;
  publicId: string;
  provider: 'r2';
};

export type DeleteResult = {
  publicId: string;
  deleted: true;
};

export type FileListItem = {
  publicId: string;
  url: string;
  size: number;
  uploadedAt: string;
};

export type ListResult = {
  items: FileListItem[];
  folder: string | null;
  truncated: boolean;
  cursor: string | null;
};

export type FileMetadata = {
  publicId: string;
  url: string;
  size: number;
  uploadedAt: string;
  contentType: string | null;
};

export const MoveInputSchema = v.pipe(
  v.object({
    newKey: v.optional(v.pipe(v.string(), v.minLength(1))),
    folder: v.optional(v.pipe(v.string(), v.minLength(1))),
    filename: v.optional(v.pipe(v.string(), v.minLength(1)))
  }),
  v.check(
    (val) => !!(val.newKey || val.folder || val.filename),
    'At least one of newKey, folder, or filename must be provided'
  )
);

export type MoveInput = v.InferInput<typeof MoveInputSchema>;

export type MoveResult = {
  oldPublicId: string;
  publicId: string;
  url: string;
  provider: 'r2';
};

export interface StorageProvider {
  upload(input: UploadInput, bucket: R2Bucket, publicUrl: string, folder: string): Promise<UploadResult>;
  delete(publicId: string, bucket: R2Bucket): Promise<DeleteResult>;
  list(bucket: R2Bucket, publicUrl: string, folder?: string, cursor?: string, limit?: number): Promise<ListResult>;
  move(oldPublicId: string, input: MoveInput, bucket: R2Bucket, publicUrl: string): Promise<MoveResult>;
}
