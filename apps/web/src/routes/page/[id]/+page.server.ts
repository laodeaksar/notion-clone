import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { API_GATEWAY_URL } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ params, fetch }) => {
  const { id } = params;

  if (!id) error(400, 'Page ID is required');

  const res = await fetch(`${API_GATEWAY_URL}/pages/${id}`);

  if (res.status === 404) error(404, 'Page not found');
  if (!res.ok) error(res.status, 'Failed to load page');

  const { page } = await res.json();
  return { page };
};
