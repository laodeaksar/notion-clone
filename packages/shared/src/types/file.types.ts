import { z } from 'zod';

export const UploadInputSchema = z.object({
  data: z.string().min(1),
  filename: z.string().optional(),
  folder: z.string().optional()
});

export type UploadInput = z.infer<typeof UploadInputSchema>;

export type UploadResult = {
  url: string;
  publicId: string;
  provider: 'r2';
};

export interface StorageProvider {
  upload(input: UploadInput): Promise<UploadResult>;
}
