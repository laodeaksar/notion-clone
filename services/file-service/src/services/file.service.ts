import * as v from 'valibot';
import { UploadInputSchema } from '../types/file.types';
import { uploadToCloudinary } from '../storage/cloudinary.storage';
import { publisher } from '../events/publisher';
import { DEFAULT_UPLOAD_FOLDER } from '../config';
import type { UploadResult, CloudinaryConfig } from '../types/file.types';

export function createFileService(config: CloudinaryConfig) {
  return {
    async upload(input: v.InferInput<typeof UploadInputSchema>): Promise<UploadResult> {
      const result = await uploadToCloudinary(input, config, DEFAULT_UPLOAD_FOLDER);
      await publisher.publish({
        type: 'file.uploaded',
        payload: { publicId: result.publicId, url: result.url, provider: result.provider }
      });
      return result;
    }
  };
}
