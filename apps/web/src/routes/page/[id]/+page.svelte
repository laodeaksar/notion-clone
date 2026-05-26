<script lang="ts">
  import Editor from '$lib/components/Editor.svelte';
  import type { PageData } from './$types';

  interface Ancestor { id: string; title: string }

  let { data }: { data: PageData } = $props();

  let ancestors = $derived((data as any).ancestors as Ancestor[] ?? []);
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
        <span class="max-w-[160px] truncate font-medium text-slate-600"
          title={data.page?.title ?? 'Untitled'}>
          {data.page?.title ?? 'Untitled'}
        </span>
      </nav>
    {/if}

    <!-- Page title -->
    <h1 class="text-2xl font-semibold text-slate-900 leading-tight">
      {data.page?.title ?? 'Untitled'}
    </h1>
  </div>

  <!-- Editor -->
  <div class="flex-1 overflow-auto px-8 py-6">
    <Editor {data} />
  </div>
</main>
