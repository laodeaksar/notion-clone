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

export interface StorageProvider {
  upload(input: UploadInput, bucket: R2Bucket, publicUrl: string, folder: string): Promise<UploadResult>;
  delete(publicId: string, bucket: R2Bucket): Promise<DeleteResult>;
}
