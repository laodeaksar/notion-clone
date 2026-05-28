// @ts-nocheck
import type { LayoutServerLoad } from './$types';
import { getEnv } from '$lib/server/env';

export const load = async ({ locals, cookies, depends, platform }: Parameters<LayoutServerLoad>[0]) => {
  depends('app:pages');
  const user = locals.user ?? null;

  if (!user) return { user, pages: [], sessionToken: null };

  const token = locals.sessionToken ?? cookies.get('better-auth.session_token');
  if (!token) return { user, pages: [], sessionToken: null };

  const API_GATEWAY_URL = getEnv(platform, 'API_GATEWAY_URL');

  try {
    const res = await fetch(`${API_GATEWAY_URL}/pages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return { user, pages: [], sessionToken: token };
    const { pages } = await res.json();
    return {
      user,
      sessionToken: token,
      pages: (pages ?? []) as Array<{ id: string; title: string; parentId: string | null }>
    };
  } catch {
    return { user, pages: [], sessionToken: token };
  }
};
