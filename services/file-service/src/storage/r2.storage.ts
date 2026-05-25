import type { UploadInput, UploadResult } from '../types/file.types';

function generateKey(folder: string, filename?: string): string {
  const name = filename ?? crypto.randomUUID();
  return `${folder}/${name}`;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const cleaned = base64.includes(',') ? base64.split(',')[1] : base64;
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function uploadToR2(
  input: UploadInput,
  bucket: R2Bucket,
  publicUrl: string,
  defaultFolder: string
): Promise<UploadResult> {
  const folder = input.folder ?? defaultFolder;
  const key = generateKey(folder, input.filename);

  const buffer = base64ToArrayBuffer(input.data);

  await bucket.put(key, buffer, {
    httpMetadata: { contentType: detectContentType(input.data) }
  });

  const url = `${publicUrl.replace(/\/$/, '')}/${key}`;

  return {
    url,
    publicId: key,
    provider: 'r2'
  };
}

export async function deleteFromR2(publicId: string, bucket: R2Bucket): Promise<void> {
  const obj = await bucket.head(publicId);
  if (!obj) {
    throw new Error(`Object not found: ${publicId}`);
  }
  await bucket.delete(publicId);
}

function detectContentType(data: string): string {
  if (data.startsWith('data:')) {
    const match = data.match(/^data:([^;]+);/);
    if (match) return match[1];
  }
  return 'application/octet-stream';
}
