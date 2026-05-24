import type { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { API_GATEWAY_URL } from '$env/static/private';

const paramsSchema = z.object({ id: z.string().min(1) });

export async function load(event: RequestEvent) {
  const result = paramsSchema.safeParse(event.params);
  if (!result.success) {
    return { status: 400 };
  }
  const { id } = result.data;
  const res = await fetch(`${API_GATEWAY_URL}/pages/${id}`);
  if (!res.ok) return { status: res.status };
  const page = await res.json();
  return { props: { page } };
}
