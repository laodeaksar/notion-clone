<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type PathStat = {
    path: string;
    requests: number;
    avgLatencyMs: number;
    errors: number;
    rateLimited: number;
  };

  type Upstream = {
    name: string;
    status: 'ok' | 'error' | 'unreachable';
    latencyMs: number;
    region: string | null;
  };

  type Metrics = {
    startedAt: string;
    uptimeSeconds: number;
    totalRequests: number;
    totalRateLimited: number;
    totalErrors: number;
    paths: PathStat[];
    note: string;
  };

  type Ping = {
    status: string;
    upstreams: Upstream[];
  };

  let metrics = $state<Metrics | null>(data.metrics as Metrics | null);
  let ping    = $state<Ping | null>(data.ping as Ping | null);
  let loading = $state(false);
  let lastUpdated = $state<Date | null>(new Date());
  let interval: ReturnType<typeof setInterval>;

  async function refresh() {
    loading = true;
    try {
      const [mRes, pRes] = await Promise.allSettled([
        fetch('/api/metrics'),
        fetch('/api/ping')
      ]);
      if (mRes.status === 'fulfilled' && mRes.value.ok) metrics = await mRes.value.json();
      if (pRes.status === 'fulfilled' && pRes.value.ok) ping    = await pRes.value.json();
      lastUpdated = new Date();
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    interval = setInterval(refresh, 10_000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });

  function formatUptime(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  }

  function errorRate(total: number, errors: number): string {
    if (total === 0) return '0.0%';
    return ((errors / total) * 100).toFixed(1) + '%';
  }

  function latencyColor(ms: number): string {
    if (ms < 100)  return 'text-emerald-600';
    if (ms < 300)  return 'text-amber-600';
    return 'text-red-600';
  }

  function statusColor(status: string): string {
    if (status === 'ok')          return 'bg-emerald-100 text-emerald-700';
    if (status === 'unreachable') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  }

  let sortKey    = $state<keyof PathStat>('requests');
  let sortAsc    = $state(false);

  let sortedPaths = $derived(
    metrics
      ? [...metrics.paths].sort((a, b) => {
          const av = a[sortKey] as number;
          const bv = b[sortKey] as number;
          return sortAsc ? av - bv : bv - av;
        })
      : []
  );

  function setSort(key: keyof PathStat) {
    if (sortKey === key) sortAsc = !sortAsc;
    else { sortKey = key; sortAsc = false; }
  }

  function sortIcon(key: keyof PathStat) {
    if (sortKey !== key) return '↕';
    return sortAsc ? '↑' : '↓';
  }
</script>

<svelte:head>
  <title>Gateway Metrics — Notion Clone</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
  <!-- Header -->
  <div class="bg-white border-b border-slate-200 px-6 py-4">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <a href="/" class="text-slate-400 hover:text-slate-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </a>
        <div>
          <h1 class="text-lg font-semibold text-slate-900">Gateway Metrics</h1>
          <p class="text-xs text-slate-500">
            {#if lastUpdated}
              Last updated {lastUpdated.toLocaleTimeString()} · auto-refreshes every 10s
            {/if}
          </p>
        </div>
      </div>
      <button
        onclick={refresh}
        disabled={loading}
        class="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 {loading ? 'animate-spin' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        {loading ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  </div>

  <div class="max-w-6xl mx-auto px-6 py-6 space-y-6">

    {#if !metrics}
      <div class="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mx-auto mb-3 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <p class="font-medium">Could not reach the gateway</p>
        <p class="text-sm mt-1">Make sure the API gateway is running on port 8080.</p>
      </div>
    {:else}

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Requests</p>
          <p class="mt-1 text-3xl font-bold text-slate-900">{metrics.totalRequests.toLocaleString()}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Error Rate</p>
          <p class="mt-1 text-3xl font-bold {metrics.totalErrors > 0 ? 'text-red-600' : 'text-emerald-600'}">
            {errorRate(metrics.totalRequests, metrics.totalErrors)}
          </p>
          <p class="text-xs text-slate-400 mt-0.5">{metrics.totalErrors} error{metrics.totalErrors !== 1 ? 's' : ''}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Rate Limited</p>
          <p class="mt-1 text-3xl font-bold {metrics.totalRateLimited > 0 ? 'text-amber-600' : 'text-slate-900'}">
            {metrics.totalRateLimited.toLocaleString()}
          </p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Uptime</p>
          <p class="mt-1 text-3xl font-bold text-violet-600">{formatUptime(metrics.uptimeSeconds)}</p>
          <p class="text-xs text-slate-400 mt-0.5">since {new Date(metrics.startedAt).toLocaleTimeString()}</p>
        </div>
      </div>

      <!-- Service Health -->
      {#if ping}
        <div class="rounded-xl border border-slate-200 bg-white">
          <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-700">Service Health</h2>
            <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium
              {ping.status === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
              <span class="h-1.5 w-1.5 rounded-full {ping.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
              {ping.status === 'ok' ? 'All systems operational' : 'Degraded'}
            </span>
          </div>
          <div class="divide-y divide-slate-50">
            {#each ping.upstreams as svc}
              <div class="flex items-center justify-between px-5 py-3">
                <div class="flex items-center gap-3">
                  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize {statusColor(svc.status)}">
                    {svc.status}
                  </span>
                  <span class="text-sm font-medium text-slate-700 capitalize">{svc.name}-service</span>
                </div>
                <span class="text-sm {latencyColor(svc.latencyMs)}">{svc.latencyMs}ms</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Per-Endpoint Table -->
      {#if sortedPaths.length > 0}
        <div class="rounded-xl border border-slate-200 bg-white">
          <div class="px-5 py-3 border-b border-slate-100">
            <h2 class="text-sm font-semibold text-slate-700">Endpoint Breakdown</h2>
            <p class="text-xs text-slate-400 mt-0.5">{metrics.note}</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-100 bg-slate-50 text-left">
                  <th class="px-5 py-2.5 font-medium text-slate-500 text-xs">Endpoint</th>
                  {#each [
                    { key: 'requests' as const,     label: 'Requests'    },
                    { key: 'avgLatencyMs' as const, label: 'Avg Latency' },
                    { key: 'errors' as const,       label: 'Errors'      },
                    { key: 'rateLimited' as const,  label: 'Rate Limited'}
                  ] as col}
                    <th
                      class="px-5 py-2.5 font-medium text-slate-500 text-xs cursor-pointer hover:text-slate-700 select-none whitespace-nowrap"
                      onclick={() => setSort(col.key)}
                    >
                      {col.label} <span class="opacity-50">{sortIcon(col.key)}</span>
                    </th>
                  {/each}
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                {#each sortedPaths as row}
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-5 py-3 font-mono text-xs text-slate-700 max-w-xs truncate" title={row.path}>
                      {row.path}
                    </td>
                    <td class="px-5 py-3 text-slate-700 tabular-nums">
                      {row.requests.toLocaleString()}
                    </td>
                    <td class="px-5 py-3 tabular-nums font-medium {latencyColor(row.avgLatencyMs)}">
                      {row.avgLatencyMs}ms
                    </td>
                    <td class="px-5 py-3 tabular-nums {row.errors > 0 ? 'text-red-600 font-medium' : 'text-slate-400'}">
                      {row.errors}
                    </td>
                    <td class="px-5 py-3 tabular-nums {row.rateLimited > 0 ? 'text-amber-600 font-medium' : 'text-slate-400'}">
                      {row.rateLimited}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {:else}
        <div class="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-400 text-sm">
          No requests recorded yet. Make some API calls and refresh.
        </div>
      {/if}

    {/if}
  </div>
</div>
