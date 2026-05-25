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
import { createQuotaRepo } from '../repository/quota.repo';
import { createFilePublisher } from '../events/publisher';
import { DEFAULT_UPLOAD_FOLDER, DEFAULT_QUOTA_BYTES } from '../config';
import type { CfQueue } from '@workspace/shared';
import type { FileEvent } from '@workspace/shared';
import type { Db } from '@workspace/db';
import type {
  UploadResult,
  DeleteResult,
  ListResult,
  FileMetadata,
  MoveInput,
  MoveResult,
  QuotaResult
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
    async getQuota(userId: string): Promise<QuotaResult> {
      if (!db) {
        return { userId, usedBytes: 0, limitBytes: DEFAULT_QUOTA_BYTES, availableBytes: DEFAULT_QUOTA_BYTES };
      }
      const repo   = createQuotaRepo(db);
      const record = await repo.get(userId).catch(() => null);
      const used   = record?.usedBytes  ?? 0;
      const limit  = record?.limitBytes ?? DEFAULT_QUOTA_BYTES;
      return {
        userId,
        usedBytes:      used,
        limitBytes:     limit,
        availableBytes: Math.max(0, limit - used)
      };
    },

    async upload(
      input: v.InferInput<typeof UploadInputSchema>,
      uploadedBy?: string
    ): Promise<UploadResult> {
      const result = await uploadToCloudinary(input, cloudName, apiKey, apiSecret, DEFAULT_UPLOAD_FOLDER);

      if (db) {
        if (uploadedBy) {
          const quotaRepo = createQuotaRepo(db);
          const quota     = await quotaRepo.get(uploadedBy).catch(() => null);
          const used      = quota?.usedBytes  ?? 0;
          const limit     = quota?.limitBytes ?? DEFAULT_QUOTA_BYTES;
          if (used + result.size > limit) {
            await deleteFromCloudinary(result.publicId, cloudName, apiKey, apiSecret, result.contentType)
              .catch(() => {});
            throw new Error(`Storage quota exceeded. Used: ${used} bytes, Limit: ${limit} bytes`);
          }
          await quotaRepo.upsertAdd(uploadedBy, limit, result.size)
            .catch((err) => console.error('[file-service] quota update failed:', err));
        }

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
        if (uploadedBy) {
          const quotaRepo = createQuotaRepo(db);
          const quota     = await quotaRepo.get(uploadedBy).catch(() => null);
          const used      = quota?.usedBytes  ?? 0;
          const limit     = quota?.limitBytes ?? DEFAULT_QUOTA_BYTES;
          if (used + result.size > limit) {
            await deleteFromCloudinary(result.publicId, cloudName, apiKey, apiSecret, result.contentType)
              .catch(() => {});
            throw new Error(`Storage quota exceeded. Used: ${used} bytes, Limit: ${limit} bytes`);
          }
          await quotaRepo.upsertAdd(uploadedBy, limit, result.size)
            .catch((err) => console.error('[file-service] quota update failed:', err));
        }

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

    async delete(publicId: string, deletedBy?: string): Promise<DeleteResult> {
      let contentType: string | null = null;
      let fileSize    = 0;

      if (db) {
        const repo   = createFileRepo(db);
        const record = await repo.findById(publicId).catch(() => null);
        contentType  = record?.contentType ?? null;
        fileSize     = record?.size ?? 0;
      }

      await deleteFromCloudinary(publicId, cloudName, apiKey, apiSecret, contentType);

      if (db) {
        const repo = createFileRepo(db);
        await repo.delete(publicId)
          .catch((err) => console.error('[file-service] DB delete failed:', err));

        if (deletedBy && fileSize > 0) {
          const quotaRepo = createQuotaRepo(db);
          await quotaRepo.upsertAdd(deletedBy, DEFAULT_QUOTA_BYTES, -fileSize)
            .catch((err) => console.error('[file-service] quota release failed:', err));
        }
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
