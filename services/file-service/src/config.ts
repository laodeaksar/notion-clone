export const PORT = process.env.PORT ? Number(process.env.PORT) : 8084;

export const cloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  apiKey: process.env.CLOUDINARY_API_KEY ?? '',
  apiSecret: process.env.CLOUDINARY_API_SECRET ?? ''
};

export const isCloudinaryConfigured =
  Boolean(cloudinaryConfig.cloudName) &&
  Boolean(cloudinaryConfig.apiKey) &&
  Boolean(cloudinaryConfig.apiSecret);

export const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER ?? 'notion-clone';
export const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR ?? './uploads';
