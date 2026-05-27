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

  // ── PWA install prompt ─────────────────────────────────────────────────────
  let installPrompt: any   = $state(null);
  let installDismissed     = $state(false);

  onMount(() => {
    initQueue();

    // Capture the browser's install prompt (only fires if app is installable)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      installPrompt = e;
    });

    // Clear prompt once installed
    window.addEventListener('appinstalled', () => {
      installPrompt    = null;
      installDismissed = false;
    });
  });

  async function installApp() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') installPrompt = null;
    else installDismissed = true;
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('notion-page-icons-v1');
    localStorage.removeItem('notion:pending-mutations');
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

        {#if installPrompt && !installDismissed}
          <button
            type="button"
            onclick={installApp}
            class="flex items-center gap-1.5 rounded-lg bg-violet-50 border border-violet-200 px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors"
            title="Install app for offline use"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v13m0 0l-4-4m4 4l4-4M2 17v2a2 2 0 002 2h16a2 2 0 002-2v-2"/>
            </svg>
            Install
          </button>
        {/if}

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
