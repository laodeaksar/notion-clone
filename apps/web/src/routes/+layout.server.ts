import type { LayoutServerLoad } from './$types';
import { API_GATEWAY_URL } from '$env/dynamic/private';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
  const user = locals.user ?? null;
  if (!user) return { user, pages: [] };

  const token = cookies.get('token');
  if (!token) return { user, pages: [] };

  try {
    const res = await fetch(`${API_GATEWAY_URL}/pages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return { user, pages: [] };
    const { pages } = await res.json();
    return { user, pages: (pages ?? []) as Array<{ id: string; title: string; parentId: string | null }> };
  } catch {
    return { user, pages: [] };
  }
};
