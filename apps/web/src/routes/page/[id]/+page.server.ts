import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { API_GATEWAY_URL } from '$env/dynamic/private';

interface PageRecord {
  id:       string;
  title:    string;
  parentId: string | null;
}

export const load: PageServerLoad = async ({ params, fetch }) => {
  const { id } = params;
  if (!id) error(400, 'Page ID is required');

  // Fetch the page and its ancestors in parallel — single round-trip each,
  // replaces the old sequential N-fetch waterfall loop.
  const [pageRes, ancestorsRes] = await Promise.all([
    fetch(`${API_GATEWAY_URL}/pages/${id}`),
    fetch(`${API_GATEWAY_URL}/pages/${id}/ancestors`)
  ]);

  if (pageRes.status === 404) error(404, 'Page not found');
  if (!pageRes.ok) error(pageRes.status, 'Failed to load page');

  const [{ page }, ancestorsBody] = await Promise.all([
    pageRes.json(),
    ancestorsRes.ok ? ancestorsRes.json() : Promise.resolve({ ancestors: [] })
  ]);

  const ancestors: PageRecord[] = ancestorsBody.ancestors ?? [];

  return { page, ancestors };
};
