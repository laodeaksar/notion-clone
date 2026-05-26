<script lang="ts">
  import Editor from '$lib/components/Editor.svelte';
  import { invalidate } from '$app/navigation';
  import type { PageData } from './$types';

  interface Ancestor { id: string; title: string }

  let { data }: { data: PageData } = $props();

  let ancestors  = $derived((data as any).ancestors as Ancestor[] ?? []);
  let pageId     = $derived(data.page?.id ?? '');
  let savedTitle = $derived(data.page?.title ?? 'Untitled');

  // ── Inline title edit state ───────────────────────────────────────────────
  let editing    = $state(false);
  let titleValue = $state('');
  let saving     = $state(false);
  let saveError  = $state(false);

  // Keep local draft in sync when page data changes (navigation to another page)
  $effect(() => { titleValue = savedTitle; });

  function startEdit() {
    titleValue = savedTitle;
    editing    = true;
  }

  async function commitTitle() {
    editing = false;
    const next = titleValue.trim() || 'Untitled';
    if (next === savedTitle) return; // no change

    saving    = true;
    saveError = false;
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method:  'PUT',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ title: next })
      });
      if (!res.ok) throw new Error('Save failed');
      // Refresh the layout server load so the sidebar picks up the new title
      await invalidate('app:pages');
    } catch {
      saveError = true;
      titleValue = savedTitle; // revert on error
    } finally {
      saving = false;
    }
  }

  function onTitleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter')  { e.preventDefault(); (e.target as HTMLElement).blur(); }
    if (e.key === 'Escape') { titleValue = savedTitle; editing = false; }
  }
</script>

<main class="flex h-full flex-col">
  <!-- Breadcrumb + title bar -->
  <div class="border-b border-slate-100 bg-white px-8 py-3">

    <!-- Breadcrumb trail -->
    {#if ancestors.length > 0}
      <nav class="mb-2 flex items-center gap-1 text-xs text-slate-400" aria-label="Breadcrumb">
        <a href="/" class="hover:text-slate-600 transition-colors">Home</a>

        {#each ancestors as ancestor}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 shrink-0" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M9 18l6-6-6-6"/>
          </svg>
          <a href="/page/{ancestor.id}"
            class="max-w-[140px] truncate hover:text-slate-600 transition-colors"
            title={ancestor.title}>
            {ancestor.title}
          </a>
        {/each}

        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 shrink-0" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M9 18l6-6-6-6"/>
        </svg>
        <!-- Current page in breadcrumb reflects live titleValue -->
        <span class="max-w-[160px] truncate font-medium text-slate-600"
          title={titleValue}>
          {titleValue}
        </span>
      </nav>
    {/if}

    <!-- Inline-editable page title -->
    <div class="group relative flex items-center gap-2">
      {#if editing}
        <input
          type="text"
          bind:value={titleValue}
          onblur={commitTitle}
          onkeydown={onTitleKeydown}
          maxlength={80}
          autofocus
          class="w-full bg-transparent text-2xl font-semibold text-slate-900 leading-tight
                 focus:outline-none border-b-2 border-violet-400 pb-0.5 caret-violet-500"
          aria-label="Page title"
        />
      {:else}
        <h1
          role="button"
          tabindex="0"
          onclick={startEdit}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEdit(); }}
          class="cursor-text select-none text-2xl font-semibold text-slate-900 leading-tight
                 rounded px-0.5 -mx-0.5 hover:bg-slate-50 transition-colors"
          title="Click to edit title"
        >
          {titleValue}
        </h1>
      {/if}

      <!-- Saving indicator -->
      {#if saving}
        <span class="shrink-0 text-xs text-slate-400 animate-pulse">Saving…</span>
      {:else if saveError}
        <span class="shrink-0 text-xs text-red-400">Save failed</span>
      {/if}

      <!-- Edit hint (visible on hover when not editing) -->
      {#if !editing && !saving}
        <span class="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2
                     text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
          Click to edit
        </span>
      {/if}
    </div>
  </div>

  <!-- Editor -->
  <div class="flex-1 overflow-auto px-8 py-6">
    <Editor {data} />
  </div>
</main>
