<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  interface Page {
    id:       string;
    title:    string;
    parentId: string | null;
  }

  let { initialPages }: { initialPages: Page[] } = $props();

  let pages:      Page[]        = $state([...initialPages]);
  let collapsed:  boolean       = $state(false);
  let creating:   boolean       = $state(false);
  let newTitle:   string        = $state('');
  let renamingId: string | null = $state(null);
  let renameVal:  string        = $state('');
  let confirmId:  string | null = $state(null);
  let busy:       boolean       = $state(false);

  $effect(() => {
    pages = [...initialPages];
  });

  let currentId = $derived($page.params.id ?? null);

  function startCreate() {
    creating = true;
    newTitle = '';
  }

  async function submitCreate(e: Event) {
    e.preventDefault();
    const title = newTitle.trim() || 'Untitled';
    creating = false;
    newTitle = '';
    busy = true;
    try {
      const res = await fetch('/api/pages', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ title })
      });
      if (res.ok) {
        const { page: created } = await res.json();
        pages = [...pages, created];
        goto(`/page/${created.id}`);
      }
    } finally {
      busy = false;
    }
  }

  function startRename(p: Page) {
    renamingId = p.id;
    renameVal  = p.title;
  }

  async function submitRename(e: Event) {
    e.preventDefault();
    const id    = renamingId;
    const title = renameVal.trim();
    renamingId  = null;
    if (!id || !title) return;
    pages = pages.map(p => p.id === id ? { ...p, title } : p);
    await fetch(`/api/pages/${id}`, {
      method:  'PUT',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ title })
    });
  }

  async function deletePage(id: string) {
    confirmId = null;
    pages = pages.filter(p => p.id !== id);
    await fetch(`/api/pages/${id}`, { method: 'DELETE' });
    if (currentId === id) goto('/');
  }
</script>

<!-- Sidebar wrapper -->
<aside
  class="flex flex-col border-r border-slate-200 bg-white transition-all duration-200 {collapsed ? 'w-10' : 'w-60'} shrink-0"
>
  <!-- Header row -->
  <div class="flex items-center justify-between px-3 py-3 border-b border-slate-100">
    {#if !collapsed}
      <span class="text-xs font-semibold uppercase tracking-widest text-slate-400">Pages</span>
    {/if}
    <button
      type="button"
      onclick={() => { collapsed = !collapsed; }}
      class="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {#if collapsed}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      {/if}
    </button>
  </div>

  {#if !collapsed}
    <!-- Page list -->
    <nav class="flex-1 overflow-y-auto py-1.5">
      {#each pages as p (p.id)}
        {@const isActive    = p.id === currentId}
        {@const isRenaming  = renamingId === p.id}
        {@const isConfirm   = confirmId  === p.id}

        <div
          class="group relative flex items-center gap-1.5 px-2 py-0.5 mx-1.5 rounded-lg transition-colors
            {isActive ? 'bg-violet-50 text-violet-700' : 'text-slate-700 hover:bg-slate-100'}"
        >
          <!-- Page icon -->
          <span class="shrink-0 text-sm {isActive ? 'text-violet-500' : 'text-slate-400'}">📄</span>

          {#if isRenaming}
            <!-- Inline rename form -->
            <form class="flex-1 flex items-center gap-1" onsubmit={submitRename}>
              <input
                type="text"
                bind:value={renameVal}
                autofocus
                maxlength={80}
                class="min-w-0 flex-1 rounded border border-violet-300 px-1.5 py-0.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-400"
                onkeydown={(e) => { if (e.key === 'Escape') { renamingId = null; } }}
              />
              <button type="submit" class="shrink-0 rounded bg-violet-600 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-violet-700">
                OK
              </button>
            </form>

          {:else if isConfirm}
            <!-- Delete confirm -->
            <span class="flex-1 truncate text-xs text-red-600 font-medium">Delete?</span>
            <button
              type="button"
              class="shrink-0 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-red-600"
              onclick={() => deletePage(p.id)}
            >Yes</button>
            <button
              type="button"
              class="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-slate-500 hover:bg-slate-200"
              onclick={() => { confirmId = null; }}
            >No</button>

          {:else}
            <!-- Normal row -->
            <a
              href="/page/{p.id}"
              class="min-w-0 flex-1 truncate text-sm leading-6"
              title={p.title}
            >{p.title}</a>

            <!-- Hover actions -->
            <div class="hidden items-center gap-0.5 group-hover:flex">
              <button
                type="button"
                onclick={() => startRename(p)}
                class="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                aria-label="Rename page"
                title="Rename"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button
                type="button"
                onclick={() => { confirmId = p.id; }}
                class="rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                aria-label="Delete page"
                title="Delete"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          {/if}
        </div>
      {/each}

      <!-- Empty state -->
      {#if pages.length === 0}
        <p class="px-4 py-3 text-xs text-slate-400 italic">No pages yet.</p>
      {/if}

      <!-- New page inline form -->
      {#if creating}
        <form
          class="mx-1.5 mt-0.5 flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1"
          onsubmit={submitCreate}
        >
          <span class="text-sm text-slate-400">📄</span>
          <input
            type="text"
            bind:value={newTitle}
            autofocus
            placeholder="Page title…"
            maxlength={80}
            class="min-w-0 flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            onkeydown={(e) => { if (e.key === 'Escape') { creating = false; } }}
          />
          <button type="submit" class="shrink-0 rounded bg-violet-600 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-violet-700">
            Add
          </button>
        </form>
      {/if}
    </nav>

    <!-- Footer: New page button -->
    <div class="border-t border-slate-100 p-2">
      <button
        type="button"
        onclick={startCreate}
        disabled={busy}
        class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New page
      </button>
    </div>
  {/if}

  <!-- Collapsed: just a "new page" icon -->
  {#if collapsed}
    <div class="flex flex-col items-center gap-2 py-2">
      <button
        type="button"
        onclick={() => { collapsed = false; startCreate(); }}
        class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        title="New page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>
  {/if}
</aside>
