import * as v from 'valibot';
import { UploadInputSchema } from '../types/file.types';
import { uploadToR2, uploadFileToR2, deleteFromR2, listFromR2, headFromR2, moveInR2 } from '../storage/r2.storage';
import { publisher } from '../events/publisher';
import { DEFAULT_UPLOAD_FOLDER } from '../config';
import type { UploadResult, DeleteResult, ListResult, FileMetadata, MoveInput, MoveResult } from '../types/file.types';

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

    async uploadFile(file: File, folder?: string, filename?: string): Promise<UploadResult> {
      const result = await uploadFileToR2(file, bucket, publicUrl, DEFAULT_UPLOAD_FOLDER, folder, filename);
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
    },

    async head(publicId: string): Promise<FileMetadata> {
      return headFromR2(publicId, bucket, publicUrl);
    },

    async move(oldPublicId: string, input: MoveInput): Promise<MoveResult> {
      let newPublicId: string;
      if (input.newKey) {
        newPublicId = input.newKey;
      } else {
        const parts = oldPublicId.split('/');
        const currentFolder = parts.slice(0, -1).join('/');
        const currentFilename = parts[parts.length - 1];
        const resolvedFolder = input.folder ?? currentFolder;
        const resolvedFilename = input.filename ?? currentFilename;
        newPublicId = `${resolvedFolder}/${resolvedFilename}`;
      }
      const result = await moveInR2(oldPublicId, newPublicId, bucket, publicUrl);
      await publisher.publish({
        type: 'file.moved',
        payload: { oldPublicId: result.oldPublicId, publicId: result.publicId, url: result.url }
      });
      return result;
    }
  };
}
