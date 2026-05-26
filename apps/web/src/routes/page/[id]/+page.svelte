<script lang="ts">
  import Editor from '$lib/components/Editor.svelte';
  import EmojiPicker from '$lib/components/EmojiPicker.svelte';
  import { pageIcons } from '$lib/stores/pageIcons';
  import { invalidate } from '$app/navigation';
  import { scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { enqueue } from '$lib/offline/queue';
  import type { PageData } from './$types';

  interface Ancestor { id: string; title: string }

  let { data }: { data: PageData } = $props();

  let ancestors  = $derived((data as any).ancestors as Ancestor[] ?? []);
  let pageId     = $derived(data.page?.id ?? '');
  let savedTitle = $derived(data.page?.title ?? 'Untitled');

  // ── Inline title edit state ────────────────────────────────────────────────
  let editing    = $state(false);
  let titleValue = $state('');
  let saving     = $state(false);
  let saveError  = $state(false);

  $effect(() => { titleValue = savedTitle; });

  function startEdit() { titleValue = savedTitle; editing = true; }

  async function commitTitle() {
    editing = false;
    const next = titleValue.trim() || 'Untitled';
    if (next === savedTitle) return;
    saving = true; saveError = false;

    // Offline: queue the mutation optimistically and return
    if (!navigator.onLine) {
      enqueue({
        url:    `/api/pages/${pageId}`,
        method: 'PUT',
        body:   JSON.stringify({ title: next })
      });
      saving = false;
      return;
    }

    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method:  'PUT',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ title: next })
      });
      if (!res.ok) throw new Error();
      await invalidate('app:pages');
    } catch {
      if (!navigator.onLine) {
        // Lost connection mid-request — queue it
        enqueue({
          url:    `/api/pages/${pageId}`,
          method: 'PUT',
          body:   JSON.stringify({ title: next })
        });
      } else {
        saveError = true;
        titleValue = savedTitle;
      }
    } finally { saving = false; }
  }

  function onTitleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter')  { e.preventDefault(); (e.target as HTMLElement).blur(); }
    if (e.key === 'Escape') { titleValue = savedTitle; editing = false; }
  }

  // ── Emoji picker state ─────────────────────────────────────────────────────
  let pickerOpen = $state(false);

  function pickEmoji(emoji: string) {
    pageIcons.setIcon(pageId, emoji);
    pickerOpen = false;
  }

  function clearEmoji() {
    pageIcons.clearIcon(pageId);
    pickerOpen = false;
  }

  function closePickerOnOutside(e: MouseEvent) {
    if (pickerOpen) pickerOpen = false;
  }
</script>

<!-- Click outside to close picker -->
<svelte:window onclick={closePickerOnOutside} />

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
            <!-- Show ancestor's icon if set -->
            {#if $pageIcons[ancestor.id]}<span class="mr-0.5">{$pageIcons[ancestor.id]}</span>{/if}{ancestor.title}
          </a>
        {/each}

        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 shrink-0" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M9 18l6-6-6-6"/>
        </svg>
        <span class="max-w-[160px] truncate font-medium text-slate-600" title={titleValue}>
          {#if $pageIcons[pageId]}<span class="mr-0.5">{$pageIcons[pageId]}</span>{/if}{titleValue}
        </span>
      </nav>
    {/if}

    <!-- Emoji picker + inline-editable title -->
    <div class="group relative flex items-center gap-3">

      <!-- Emoji button -->
      <div class="relative shrink-0">
        <button
          type="button"
          onclick={(e) => { e.stopPropagation(); pickerOpen = !pickerOpen; }}
          class="flex h-10 w-10 items-center justify-center rounded-xl text-2xl
                 hover:bg-slate-100 transition-colors {pickerOpen ? 'bg-slate-100' : ''}"
          title="Change page icon"
          aria-label="Change page icon"
        >
          {$pageIcons[pageId] ?? '📝'}
        </button>

        <!-- Picker popover -->
        {#if pickerOpen}
          <div
            class="absolute left-0 top-12 z-50"
            onclick={(e) => e.stopPropagation()}
            transition:scale={{ duration: 150, start: 0.92, opacity: 0, easing: cubicOut }}
          >
            <EmojiPicker
              current={$pageIcons[pageId] ?? ''}
              onselect={pickEmoji}
              onclear={clearEmoji}
            />
          </div>
        {/if}
      </div>

      <!-- Title -->
      <div class="relative flex flex-1 items-center gap-2 min-w-0">
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

        {#if saving}
          <span class="shrink-0 text-xs text-slate-400 animate-pulse">Saving…</span>
        {:else if saveError}
          <span class="shrink-0 text-xs text-red-400">Save failed</span>
        {/if}

        {#if !editing && !saving}
          <span class="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2
                       text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
            Click to edit
          </span>
        {/if}
      </div>
    </div>
  </div>

  <!-- Editor -->
  <div class="flex-1 overflow-auto px-8 py-6">
    <Editor {data} />
  </div>
</main>
