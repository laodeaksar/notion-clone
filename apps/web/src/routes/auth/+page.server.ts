import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getEnv } from '$lib/server/env';

export const load: PageServerLoad = ({ locals }) => {
  if (locals.user) throw redirect(302, '/');
};

type BetterAuthResponse = {
  user?:    { id: string; email: string; name?: string | null };
  session?: { token: string; id: string };
  token?:   string;
  message?: string;
  error?:   string;
  code?:    string;
};

function setSessionCookie(
  cookies: Parameters<Actions['login']>[0]['cookies'],
  token: string
) {
  cookies.set('better-auth.session_token', token, {
    httpOnly: true,
    path:     '/',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7
  });
}

export const actions: Actions = {
  login: async ({ request, cookies, fetch, platform }) => {
    const API_GATEWAY_URL = getEnv(platform, 'API_GATEWAY_URL');
    const data     = await request.formData();
    const email    = data.get('email')?.toString().trim() ?? '';
    const password = data.get('password')?.toString()     ?? '';

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required', email });
    }

    const res  = await fetch(`${API_GATEWAY_URL}/auth/sign-in/email`, {
      method:  'POST',
      headers: { 'content-type': 'application/json', 'origin': 'http://localhost:5000' },
      body:    JSON.stringify({ email, password })
    });

    const body = await res.json().catch(() => ({} as BetterAuthResponse)) as BetterAuthResponse;

    if (!res.ok) {
      const msg = body.message ?? body.error ?? 'Invalid email or password';
      return fail(res.status, { error: msg, email });
    }

    const loginToken = body.token ?? body.session?.token;
    if (loginToken) {
      setSessionCookie(cookies, loginToken);
    }

    throw redirect(302, '/');
  },

  register: async ({ request, cookies, fetch, platform }) => {
    const API_GATEWAY_URL = getEnv(platform, 'API_GATEWAY_URL');
    const data     = await request.formData();
    const email    = data.get('email')?.toString().trim() ?? '';
    const password = data.get('password')?.toString()     ?? '';
    const name     = data.get('name')?.toString().trim()  || undefined;

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required', email, name });
    }
    if (password.length < 8) {
      return fail(400, { error: 'Password must be at least 8 characters', email, name });
    }

    const res  = await fetch(`${API_GATEWAY_URL}/auth/sign-up/email`, {
      method:  'POST',
      headers: { 'content-type': 'application/json', 'origin': 'http://localhost:5000' },
      body:    JSON.stringify({ email, password, name: name ?? email.split('@')[0] })
    });

    const body = await res.json().catch(() => ({} as BetterAuthResponse)) as BetterAuthResponse;

    if (!res.ok) {
      const msg = body.message ?? body.error ?? 'Registration failed';
      return fail(res.status, { error: msg, email, name });
    }

    const regToken = body.token ?? body.session?.token;
    if (regToken) {
      setSessionCookie(cookies, regToken);
    }

    throw redirect(302, '/');
  }
};
