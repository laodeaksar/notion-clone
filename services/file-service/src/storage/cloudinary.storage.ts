import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryConfig, UPLOAD_FOLDER } from '../config';
import type { StorageProvider, UploadInput, UploadResult } from '../types/file.types';

cloudinary.config({
  cloud_name: cloudinaryConfig.cloudName,
  api_key: cloudinaryConfig.apiKey,
  api_secret: cloudinaryConfig.apiSecret
});

export const cloudinaryStorage: StorageProvider = {
  async upload(input: UploadInput): Promise<UploadResult> {
    const folder = input.folder ?? UPLOAD_FOLDER;
    const result = await cloudinary.uploader.upload(input.data, {
      folder,
      ...(input.filename && { public_id: input.filename })
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      provider: 'cloudinary'
    };
  }
};
