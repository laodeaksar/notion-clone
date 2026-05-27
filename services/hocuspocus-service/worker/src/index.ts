export interface Env {
  HOCUSPOCUS_BACKEND_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!env.HOCUSPOCUS_BACKEND_URL) {
      return new Response('HOCUSPOCUS_BACKEND_URL is not configured', { status: 503 });
    }

    const url = new URL(request.url);
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
