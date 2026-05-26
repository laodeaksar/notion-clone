<script lang="ts">
  import '../lib/styles/globals.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import OfflineBanner from '$lib/components/OfflineBanner.svelte';
  import { initQueue } from '$lib/offline/queue';
  import { onMount } from 'svelte';
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  let user  = $derived(data.user ?? null);
  let pages = $derived(data.pages ?? []);

  onMount(() => initQueue());

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth';
  }
</script>

<div class="flex h-screen flex-col overflow-hidden bg-slate-50">

  <!-- Offline / sync status banner (shown at the very top) -->
  <OfflineBanner />

  {#if user}
    <!-- Top nav -->
    <nav class="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-2.5">
      <a href="/" class="text-sm font-semibold text-slate-800 hover:text-violet-600 transition-colors">
        Notion Clone
      </a>
      <div class="flex items-center gap-3">
        <span class="text-sm text-slate-600">
          {user.name ?? user.email}
        </span>
        <button
          type="button"
          onclick={logout}
          class="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>

    <!-- Body: sidebar + content -->
    <div class="flex flex-1 overflow-hidden">
      <Sidebar initialPages={pages} />
      <div class="flex-1 overflow-auto">
        {@render children()}
      </div>
    </div>

  {:else}
    {@render children()}
  {/if}

</div>
