// @ts-nocheck
import type { PageServerLoad } from './$types';
import { nameFromPublicId } from '$lib/utils';

export interface GalleryFile {
  publicId:   string;
  url:        string;
  size:       number;
  name:       string;
  uploadedAt: string;
}

export interface GalleryData {
  files:     GalleryFile[];
  truncated: boolean;
  cursor:    string | null;
  error:     string | null;
}

export const load = async ({ fetch, url }: Parameters<PageServerLoad>[0]): Promise<GalleryData> => {
  const folder = url.searchParams.get('folder') ?? 'notion-clone';
  const cursor = url.searchParams.get('cursor') ?? undefined;
  const limit  = '50';

  const params = new URLSearchParams({ folder, limit });
  if (cursor) params.set('cursor', cursor);

  try {
    const res = await fetch(`/api/files?${params}`);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to load files' }));
      return { files: [], truncated: false, cursor: null, error: err.error ?? 'Failed to load files' };
    }

    const data = await res.json() as {
      items:     Array<{ publicId: string; url: string; size: number; uploadedAt: string }>;
      truncated: boolean;
      cursor:    string | null;
    };

    const files: GalleryFile[] = (data.items ?? []).map(item => ({
      publicId:   item.publicId,
      url:        item.url,
      size:       item.size,
      name:       nameFromPublicId(item.publicId),
      uploadedAt: item.uploadedAt
    }));

    return { files, truncated: data.truncated ?? false, cursor: data.cursor ?? null, error: null };
  } catch (e: any) {
    return { files: [], truncated: false, cursor: null, error: 'File service unavailable' };
  }
};
