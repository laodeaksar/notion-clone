import * as v from 'valibot';
import { UploadInputSchema } from '../types/file.types';
import {
  uploadToCloudinary,
  uploadFileToCloudinary,
  deleteFromCloudinary,
  listFromCloudinary,
  headFromCloudinary,
  moveInCloudinary
} from '../storage/cloudinary.storage';
import { createFileRepo } from '../repository/file.repo';
import { createFilePublisher } from '../events/publisher';
import { DEFAULT_UPLOAD_FOLDER } from '../config';
import type { CfQueue } from '@workspace/shared';
import type { FileEvent } from '@workspace/shared';
import type { Db } from '@workspace/db';
import type {
  UploadResult,
  DeleteResult,
  ListResult,
  FileMetadata,
  MoveInput,
  MoveResult
} from '../types/file.types';

export function createFileService(
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  db?: Db | null,
  eventsQueue?: CfQueue<FileEvent> | null
) {
  const publisher = createFilePublisher(eventsQueue);

  return {
    async upload(
      input: v.InferInput<typeof UploadInputSchema>,
      uploadedBy?: string
    ): Promise<UploadResult> {
      const result = await uploadToCloudinary(input, cloudName, apiKey, apiSecret, DEFAULT_UPLOAD_FOLDER);
      if (db) {
        const repo = createFileRepo(db);
        await repo.create({
          id:          result.publicId,
          name:        result.name,
          url:         result.url,
          size:        result.size,
          contentType: result.contentType,
          folder:      input.folder ?? DEFAULT_UPLOAD_FOLDER,
          provider:    result.provider,
          uploadedBy:  uploadedBy ?? null,
          pageId:      null
        }).catch((err) => console.error('[file-service] DB insert failed:', err));
      }
      await publisher.publish({
        type:    'file.uploaded',
        payload: { publicId: result.publicId, url: result.url, provider: result.provider }
      });
      return result;
    },

    async uploadFile(
      file: File,
      folder?: string,
      filename?: string,
      uploadedBy?: string
    ): Promise<UploadResult> {
      const result = await uploadFileToCloudinary(
        file, cloudName, apiKey, apiSecret, DEFAULT_UPLOAD_FOLDER, folder, filename
      );
      if (db) {
        const repo = createFileRepo(db);
        await repo.create({
          id:          result.publicId,
          name:        result.name,
          url:         result.url,
          size:        result.size,
          contentType: result.contentType,
          folder:      folder ?? DEFAULT_UPLOAD_FOLDER,
          provider:    result.provider,
          uploadedBy:  uploadedBy ?? null,
          pageId:      null
        }).catch((err) => console.error('[file-service] DB insert failed:', err));
      }
      await publisher.publish({
        type:    'file.uploaded',
        payload: { publicId: result.publicId, url: result.url, provider: result.provider }
      });
      return result;
    },

    async delete(publicId: string): Promise<DeleteResult> {
      let contentType: string | null = null;
      if (db) {
        const repo   = createFileRepo(db);
        const record = await repo.findById(publicId).catch(() => null);
        contentType  = record?.contentType ?? null;
      }
      await deleteFromCloudinary(publicId, cloudName, apiKey, apiSecret, contentType);
      if (db) {
        const repo = createFileRepo(db);
        await repo.delete(publicId)
          .catch((err) => console.error('[file-service] DB delete failed:', err));
      }
      await publisher.publish({
        type:    'file.deleted',
        payload: { publicId }
      });
      return { publicId, deleted: true };
    },

    async list(folder?: string, cursor?: string, limit?: number): Promise<ListResult> {
      const result = await listFromCloudinary(cloudName, apiKey, apiSecret, folder, cursor, limit);
      return { ...result, folder: folder ?? null };
    },

    async head(publicId: string): Promise<FileMetadata> {
      return headFromCloudinary(publicId, cloudName, apiKey, apiSecret);
    },

    async move(oldPublicId: string, input: MoveInput): Promise<MoveResult> {
      let newPublicId: string;
      if (input.newKey) {
        newPublicId = input.newKey;
      } else {
        const parts           = oldPublicId.split('/');
        const currentFolder   = parts.slice(0, -1).join('/');
        const currentFilename = parts[parts.length - 1];
        const resolvedFolder   = input.folder   ?? currentFolder;
        const resolvedFilename = input.filename ?? currentFilename;
        newPublicId = `${resolvedFolder}/${resolvedFilename}`;
      }

      let contentType: string | null = null;
      if (db) {
        const repo   = createFileRepo(db);
        const record = await repo.findById(oldPublicId).catch(() => null);
        contentType  = record?.contentType ?? null;
      }

      const result = await moveInCloudinary(
        oldPublicId, newPublicId, cloudName, apiKey, apiSecret, contentType
      );
      if (db) {
        const repo = createFileRepo(db);
        await repo.move(oldPublicId, result.publicId, result.url)
          .catch((err) => console.error('[file-service] DB move failed:', err));
      }
      await publisher.publish({
        type:    'file.moved',
        payload: { oldPublicId: result.oldPublicId, publicId: result.publicId, url: result.url }
      });
      return result;
    }
  };
}
