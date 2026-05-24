import type { UploadInput, UploadResult, CloudinaryConfig } from '../types/file.types';

/**
 * Uploads a file to Cloudinary using the REST Upload API.
 * Uses Web Crypto (SHA-1) to generate a signed upload — no Node.js SDK needed.
 * Fully compatible with Cloudflare Workers.
 */
export async function uploadToCloudinary(
  input: UploadInput,
  config: CloudinaryConfig,
  defaultFolder: string
): Promise<UploadResult> {
  const folder = input.folder ?? defaultFolder;
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const paramsToSign = [
    `folder=${folder}`,
    ...(input.filename ? [`public_id=${input.filename}`] : []),
    `timestamp=${timestamp}`
  ]
    .sort()
    .join('&');

  const sigBuf = await crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(`${paramsToSign}${config.apiSecret}`)
  );
  const signature = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const form = new FormData();
  form.append('file', input.data);
  form.append('folder', folder);
  form.append('timestamp', timestamp);
  form.append('api_key', config.apiKey);
  form.append('signature', signature);
  if (input.filename) form.append('public_id', input.filename);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    { method: 'POST', body: form }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary upload failed: ${err}`);
  }

  const data = (await res.json()) as { secure_url: string; public_id: string };
  return {
    url: data.secure_url,
    publicId: data.public_id,
    provider: 'cloudinary'
  };
}
