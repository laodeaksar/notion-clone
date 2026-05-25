import * as v from 'valibot';
import { UploadInputSchema } from '../types/file.types';
import { uploadToR2, deleteFromR2, listFromR2 } from '../storage/r2.storage';
import { publisher } from '../events/publisher';
import { DEFAULT_UPLOAD_FOLDER } from '../config';
import type { UploadResult, DeleteResult, ListResult } from '../types/file.types';

export function createFileService(bucket: R2Bucket, publicUrl: string) {
  return {
    async upload(input: v.InferInput<typeof UploadInputSchema>): Promise<UploadResult> {
      const result = await uploadToR2(input, bucket, publicUrl, DEFAULT_UPLOAD_FOLDER);
      await publisher.publish({
        type: 'file.uploaded',
        payload: { publicId: result.publicId, url: result.url, provider: result.provider }
      });
      return result;
    },

    async delete(publicId: string): Promise<DeleteResult> {
      await deleteFromR2(publicId, bucket);
      await publisher.publish({
        type: 'file.deleted',
        payload: { publicId }
      });
      return { publicId, deleted: true };
    },

    async list(folder?: string, cursor?: string, limit?: number): Promise<ListResult> {
      const result = await listFromR2(bucket, publicUrl, folder, cursor, limit);
      return { ...result, folder: folder ?? null };
    }
  };
}
