import { isCloudinaryConfigured } from '../config';
import { cloudinaryStorage } from '../storage/cloudinary.storage';
import { localStorageProvider } from '../storage/local.storage';
import { publisher } from '../events/publisher';
import { UploadInputSchema } from '../types/file.types';
import type { UploadInput, UploadResult } from '../types/file.types';

function getProvider() {
  if (isCloudinaryConfigured) {
    return cloudinaryStorage;
  }
  console.warn('[file-service] Cloudinary not configured — using local storage fallback');
  return localStorageProvider;
}

export const fileService = {
  async upload(input: unknown): Promise<UploadResult> {
    const parsed = UploadInputSchema.parse(input) as UploadInput;
    const provider = getProvider();
    const result = await provider.upload(parsed);

    await publisher.publish({
      type: 'file.uploaded',
      payload: {
        publicId: result.publicId,
        url: result.url,
        provider: result.provider
      }
    });

    return result;
  }
};
