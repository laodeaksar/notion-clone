import type { PageServerLoad } from './$types';
import { getEnv } from '$lib/server/env';

export const load: PageServerLoad = async ({ platform }) => {
  const API_GATEWAY_URL = getEnv(platform, 'API_GATEWAY_URL');

  const [metricsRes, pingRes] = await Promise.allSettled([
    fetch(`${API_GATEWAY_URL}/metrics`, { signal: AbortSignal.timeout(5000) }),
    fetch(`${API_GATEWAY_URL}/ping`,    { signal: AbortSignal.timeout(8000) })
  ]);

  const metrics = metricsRes.status === 'fulfilled' && metricsRes.value.ok
    ? await metricsRes.value.json()
    : null;

  const ping = pingRes.status === 'fulfilled' && pingRes.value.ok
    ? await pingRes.value.json()
    : null;

  return { metrics, ping };
};
