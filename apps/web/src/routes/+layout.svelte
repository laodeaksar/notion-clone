<script lang="ts">
  import '../lib/styles/globals.css';
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  let user = $derived(data.user ?? null);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth';
  }
</script>

{#if user}
  <nav class="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-2.5">
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
{/if}

{@render children()}
