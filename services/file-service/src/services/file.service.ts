import * as v from 'valibot';
import { UploadInputSchema } from '../types/file.types';
import { uploadToR2 } from '../storage/r2.storage';
import { publisher } from '../events/publisher';
import { DEFAULT_UPLOAD_FOLDER } from '../config';
import type { UploadResult } from '../types/file.types';

export function createFileService(bucket: R2Bucket, publicUrl: string) {
  return {
    async upload(input: v.InferInput<typeof UploadInputSchema>): Promise<UploadResult> {
      const result = await uploadToR2(input, bucket, publicUrl, DEFAULT_UPLOAD_FOLDER);
      await publisher.publish({
        type: 'file.uploaded',
        payload: { publicId: result.publicId, url: result.url, provider: result.provider }
      });
      return result;
    }
  };
}
