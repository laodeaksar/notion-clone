import type { LayoutServerLoad } from './$types';
import { getEnv } from '$lib/server/env';

export const load: LayoutServerLoad = async ({ locals, cookies, depends, platform }) => {
  depends('app:pages');
  const user = locals.user ?? null;

  const hocuspocusUrl = getEnv(platform, 'PUBLIC_HOCUSPOCUS_URL') || 'ws://localhost:1234';

  if (!user) return { user, pages: [], hocuspocusUrl };

  const token = locals.sessionToken ?? cookies.get('better-auth.session_token');
  if (!token) return { user, pages: [], hocuspocusUrl };

  const API_GATEWAY_URL = getEnv(platform, 'API_GATEWAY_URL');

  try {
    const res = await fetch(`${API_GATEWAY_URL}/pages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return { user, pages: [], hocuspocusUrl };
    const { pages } = await res.json();
    return {
      user,
      hocuspocusUrl,
      pages: (pages ?? []) as Array<{ id: string; title: string; parentId: string | null }>
    };
  } catch {
    return { user, pages: [], hocuspocusUrl };
  }
};
