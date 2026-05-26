import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { API_GATEWAY_URL } from '$env/dynamic/private';

interface PageRecord {
  id:       string;
  title:    string;
  parentId: string | null;
}

async function fetchPage(id: string, fetchFn: typeof fetch): Promise<PageRecord | null> {
  const res = await fetchFn(`${API_GATEWAY_URL}/pages/${id}`);
  if (!res.ok) return null;
  const { page } = await res.json();
  return page ?? null;
}

export const load: PageServerLoad = async ({ params, fetch }) => {
  const { id } = params;
  if (!id) error(400, 'Page ID is required');

  const res = await fetch(`${API_GATEWAY_URL}/pages/${id}`);
  if (res.status === 404) error(404, 'Page not found');
  if (!res.ok) error(res.status, 'Failed to load page');

  const { page } = await res.json();

  // Walk up the parent chain to build breadcrumbs (root → … → parent).
  // Cap at 10 levels to guard against cycles/deep trees.
  const ancestors: PageRecord[] = [];
  let parentId: string | null = page?.parentId ?? null;
  let depth = 0;

  while (parentId && depth < 10) {
    const ancestor = await fetchPage(parentId, fetch);
    if (!ancestor) break;
    ancestors.unshift(ancestor); // prepend so order is root-first
    parentId = ancestor.parentId;
    depth++;
  }

  return { page, ancestors };
};
