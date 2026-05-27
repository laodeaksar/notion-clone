export interface Env {
  HOCUSPOCUS_BACKEND_URL: string;
}

async function checkBackend(backendUrl: string): Promise<{
  reachable: boolean;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const res = await fetch(backendUrl, {
      signal: AbortSignal.timeout(5000)
    });
    return { reachable: res.ok || res.status < 500, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      reachable: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!env.HOCUSPOCUS_BACKEND_URL) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'HOCUSPOCUS_BACKEND_URL is not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);

    // ── Health-check endpoint ─────────────────────────────────────────────────
    if (url.pathname === '/health' && request.method === 'GET') {
      const backend = await checkBackend(env.HOCUSPOCUS_BACKEND_URL);
      const status = backend.reachable ? 'ok' : 'degraded';
      return new Response(
        JSON.stringify({
          status,
          proxy: 'ok',
          backend: {
            url: env.HOCUSPOCUS_BACKEND_URL,
            reachable: backend.reachable,
            latencyMs: backend.latencyMs,
            ...(backend.error ? { error: backend.error } : {})
          }
        }),
        {
          status: backend.reachable ? 200 : 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // ── Proxy all other traffic (HTTP + WebSocket) ────────────────────────────
    const backend = new URL(env.HOCUSPOCUS_BACKEND_URL);
    const targetUrl = new URL(url.pathname + url.search, backend);

    const isWebSocket = request.headers.get('Upgrade')?.toLowerCase() === 'websocket';

    if (isWebSocket) {
      targetUrl.protocol = backend.protocol === 'https:' ? 'wss:' : 'ws:';
    } else {
      targetUrl.protocol = backend.protocol;
    }

    return fetch(targetUrl.toString(), request);
  }
} satisfies ExportedHandler<Env>;
