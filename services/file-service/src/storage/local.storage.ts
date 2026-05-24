import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { LOCAL_UPLOAD_DIR } from '../config';
import type { StorageProvider, UploadInput, UploadResult } from '../types/file.types';

export const localStorageProvider: StorageProvider = {
  async upload(input: UploadInput): Promise<UploadResult> {
    const folder = input.folder ?? 'notion-clone';
    const dir = join(LOCAL_UPLOAD_DIR, folder);
    mkdirSync(dir, { recursive: true });

    const isBase64 = input.data.startsWith('data:');
    const filename = input.filename ?? `${crypto.randomUUID()}`;

    let buffer: Buffer;
    let ext = '';

    if (isBase64) {
      const [meta, b64] = input.data.split(',');
      const mimeMatch = meta.match(/data:([^;]+);/);
      const mime = mimeMatch?.[1] ?? 'application/octet-stream';
      ext = mime.split('/')[1] ?? 'bin';
      buffer = Buffer.from(b64, 'base64');
    } else {
      buffer = Buffer.from(input.data, 'utf-8');
      ext = 'txt';
    }

    const finalName = filename.includes('.') ? filename : `${filename}.${ext}`;
    const filePath = join(dir, finalName);
    writeFileSync(filePath, buffer);

    const publicId = `${folder}/${finalName}`;
    const url = `/uploads/${folder}/${finalName}`;

    return { url, publicId, provider: 'local' };
  }
};
