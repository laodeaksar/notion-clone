<script lang="ts">
  import { online, pendingCount, syncing } from '$lib/stores/network';
  import { flush } from '$lib/offline/queue';
  import { invalidate } from '$app/navigation';
  import { fade, fly } from 'svelte/transition';

  let syncError = $state(false);

  // When we come back online and there are pending mutations, flush them
  $effect(() => {
    if ($online && $pendingCount > 0 && !$syncing) {
      syncError = false;
      syncing.set(true);
      flush().then(async ({ succeeded, failed }) => {
        syncing.set(false);
        syncError = failed > 0;
        if (succeeded > 0) {
          // Refresh page data after successful sync
          await invalidate('app:pages');
        }
      });
    }
  });
</script>

{#if !$online}
  <div
    class="flex items-center justify-center gap-2 bg-slate-800 px-4 py-2 text-xs font-medium text-white"
    transition:fly={{ y: -32, duration: 200 }}
    role="status"
    aria-live="polite"
  >
    <span class="inline-block h-1.5 w-1.5 rounded-full bg-amber-400"></span>
    You're offline — changes will sync when you reconnect
    {#if $pendingCount > 0}
      <span class="rounded-full bg-slate-700 px-1.5 py-0.5 text-[10px] tabular-nums">
        {$pendingCount} pending
      </span>
    {/if}
  </div>

{:else if $syncing}
  <div
    class="flex items-center justify-center gap-2 bg-violet-600 px-4 py-2 text-xs font-medium text-white"
    transition:fly={{ y: -32, duration: 200 }}
    role="status"
    aria-live="polite"
  >
    <svg class="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
    </svg>
    Syncing changes…
  </div>

{:else if syncError}
  <div
    class="flex items-center justify-center gap-2 bg-red-500 px-4 py-2 text-xs font-medium text-white"
    transition:fade={{ duration: 200 }}
    role="alert"
    aria-live="assertive"
  >
    <span class="inline-block h-1.5 w-1.5 rounded-full bg-white"></span>
    Some changes failed to sync
    <button
      type="button"
      onclick={() => { syncError = false; syncing.set(true); flush().then(({ failed }) => { syncing.set(false); syncError = failed > 0; }); }}
      class="underline underline-offset-2 hover:no-underline"
    >
      Retry
    </button>
  </div>
{/if}
