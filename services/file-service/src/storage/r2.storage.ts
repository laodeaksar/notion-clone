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

export async function listFromR2(
  bucket: R2Bucket,
  publicUrl: string,
  folder?: string,
  cursor?: string,
  limit: number = 100
): Promise<{ items: { publicId: string; url: string; size: number; uploadedAt: string }[]; truncated: boolean; cursor: string | null }> {
  const base = publicUrl.replace(/\/$/, '');
  const opts: R2ListOptions = { limit };
  if (folder) opts.prefix = `${folder}/`;
  if (cursor) opts.cursor = cursor;

  const listed = await bucket.list(opts);

  const items = listed.objects.map((obj) => ({
    publicId: obj.key,
    url: `${base}/${obj.key}`,
    size: obj.size,
    uploadedAt: obj.uploaded.toISOString()
  }));

  return {
    items,
    truncated: listed.truncated,
    cursor: listed.truncated ? (listed as any).cursor ?? null : null
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
