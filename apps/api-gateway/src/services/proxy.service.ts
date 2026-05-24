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
    method: options.method ?? 'GET',
    body: options.body ?? null,
    headers: options.headers ?? {}
  });
}

export async function proxyJson<T = unknown>(
  baseUrl: string,
  path: string,
  options: ProxyOptions = {}
): Promise<{ data: T; status: number }> {
  const res = await proxyTo(baseUrl, path, options);
  const data = (await res.json()) as T;
  return { data, status: res.status };
}
