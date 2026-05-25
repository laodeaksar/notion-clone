/**
 * Derives a human-readable name from a Cloudinary public ID.
 * Strips the folder path, random suffix, and underscores.
 *
 * @example
 * nameFromPublicId('notion-clone/my_document_ab12cd') // → 'my document'
 */
export function nameFromPublicId(publicId: string): string {
  const last = publicId.split('/').pop() ?? publicId;
  return last.replace(/_[a-z0-9]{6,}$/i, '').replace(/_/g, ' ') || last;
}

/**
 * Returns true if the URL points to a common image format or a Cloudinary image upload.
 */
export function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(url) || url.includes('/image/upload/');
}

/**
 * Formats a byte count into a human-readable string (B / KB / MB).
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024)    return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
