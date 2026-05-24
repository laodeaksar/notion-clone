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
  provider: 'cloudinary';
};

export interface StorageProvider {
  upload(input: UploadInput, config: CloudinaryConfig, folder: string): Promise<UploadResult>;
}

export type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};
