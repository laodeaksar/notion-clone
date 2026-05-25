type ProxyOptions = {
  method?: string;
  body?: string | null;
  headers?: Record<string, string>;
  query?: Record<string, string | undefined>;
};

export async function proxyTo(
  baseUrl: string,
  path: string,
  options: ProxyOptions = {}
): Promise<Response> {
  const url = new URL(`${baseUrl}${path}`);

  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }
  }

  return fetch(url.toString(), {
    method:  options.method ?? 'GET',
    body:    options.body ?? null,
    headers: options.headers ?? {},
    signal:  AbortSignal.timeout(10_000)
  });
}

/**
 * proxyJson — forward a request to an upstream service and parse the JSON body.
 *
 * Handles two failure modes gracefully:
 *  - Network error (service down, ECONNREFUSED) → 503 + error message
 *  - Non-JSON response (HTML error page, empty body) → 502 + error message
 *
 * This avoids unhandled SyntaxError crashes in the gateway when a microservice
 * is temporarily unavailable.
 */
export async function proxyJson<T = unknown>(
  baseUrl: string,
  path: string,
  options: ProxyOptions = {}
): Promise<{ data: T; status: number }> {
  let res: Response;

  try {
    res = await proxyTo(baseUrl, path, options);
  } catch {
    return {
      data:   { error: 'Upstream service unavailable' } as T,
      status: 503
    };
  }

  try {
    const data = (await res.json()) as T;
    return { data, status: res.status };
  } catch {
    return {
      data:   { error: 'Invalid response from upstream service' } as T,
      status: 502
    };
  }
}
