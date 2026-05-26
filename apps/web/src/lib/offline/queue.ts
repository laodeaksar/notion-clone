import { pendingCount } from '$lib/stores/network';

export type PendingMutation = {
  id:        string;
  url:       string;
  method:    string;
  body:      string;
  createdAt: number;
};

const QUEUE_KEY = 'notion:pending-mutations';

function load(): PendingMutation[] {
  if (typeof localStorage === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]'); }
  catch { return []; }
}

function save(queue: PendingMutation[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  pendingCount.set(queue.length);
}

/**
 * Add a mutation to the queue.
 * If an identical URL+method already exists, replace it (dedup by intent).
 */
export function enqueue(mutation: Omit<PendingMutation, 'id' | 'createdAt'>): void {
  const queue = load();
  const idx   = queue.findIndex(m => m.url === mutation.url && m.method === mutation.method);
  const entry: PendingMutation = {
    ...mutation,
    id:        crypto.randomUUID(),
    createdAt: Date.now()
  };
  if (idx >= 0) queue[idx] = entry;
  else queue.push(entry);
  save(queue);
}

/** Initialise the store counter from persisted queue (call on mount) */
export function initQueue(): void {
  if (typeof localStorage !== 'undefined') {
    pendingCount.set(load().length);
  }
}

/**
 * Replay all queued mutations against the server.
 * Failed ones are re-queued; succeeded ones are removed.
 */
export async function flush(): Promise<{ succeeded: number; failed: number }> {
  const queue = load();
  if (queue.length === 0) return { succeeded: 0, failed: 0 };

  let succeeded = 0;
  let failed    = 0;
  const requeue: PendingMutation[] = [];

  for (const m of queue) {
    try {
      const res = await fetch(m.url, {
        method:  m.method,
        headers: { 'content-type': 'application/json' },
        body:    m.body
      });
      if (res.ok) succeeded++;
      else { requeue.push(m); failed++; }
    } catch {
      requeue.push(m);
      failed++;
    }
  }

  save(requeue);
  return { succeeded, failed };
}
