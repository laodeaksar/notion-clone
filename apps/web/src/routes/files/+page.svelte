<script lang="ts">
  import FileUpload from '$lib/components/FileUpload.svelte';
  import type { PageData } from './$types';
  import type { GalleryFile } from './+page.server';
  import { nameFromPublicId, isImageUrl, formatBytes } from '$lib/utils';

  export let data: PageData;

  interface SessionFile extends GalleryFile {
    isNew: true;
  }

  let gallery:    GalleryFile[]   = data.files ?? [];
  let truncated:  boolean          = data.truncated ?? false;
  let cursor:     string | null    = data.cursor ?? null;
  let loadError:  string | null    = data.error ?? null;

  let newUploads: SessionFile[]    = [];
  let copiedId:   string | null    = null;
  let deletingId: string | null    = null;
  let confirmId:  string | null    = null;
  let loadingMore: boolean         = false;
  let loadMoreError: string | null = null;

  function onUploaded(e: CustomEvent<{ url: string; publicId: string; name: string }>) {
    const { url, publicId, name } = e.detail;
    const fresh: SessionFile = {
      publicId,
      url,
      name,
      size:       0,
      uploadedAt: new Date().toISOString(),
      isNew:      true
    };
    newUploads = [fresh, ...newUploads];
    gallery    = gallery.filter(f => f.publicId !== publicId);
  }

  async function copyUrl(url: string, id: string) {
    await navigator.clipboard.writeText(url).catch(() => {});
    copiedId = id;
    setTimeout(() => { copiedId = null; }, 2000);
  }

  function requestDelete(publicId: string) { confirmId  = publicId; }
  function cancelDelete()                  { confirmId  = null; }

  async function confirmDelete(publicId: string) {
    confirmId  = null;
    deletingId = publicId;
    try {
      const res = await fetch(`/api/files?publicId=${encodeURIComponent(publicId)}`, { method: 'DELETE' });
      if (res.ok) {
        newUploads = newUploads.filter(f => f.publicId !== publicId);
        gallery    = gallery.filter(f => f.publicId !== publicId);
      } else {
        const err = await res.json().catch(() => ({ error: 'Delete failed' }));
        alert(err.error ?? 'Delete failed');
      }
    } catch {
      alert('Network error — could not delete file');
    } finally {
      deletingId = null;
    }
  }

  async function loadMore() {
    if (!cursor || loadingMore) return;
    loadingMore    = true;
    loadMoreError  = null;
    try {
      const params = new URLSearchParams({ folder: 'notion-clone', limit: '50', cursor });
      const res    = await fetch(`/api/files?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Load failed' }));
        loadMoreError = err.error ?? 'Load failed';
        return;
      }
      const data = await res.json() as {
        items:     Array<{ publicId: string; url: string; size: number; uploadedAt: string }>;
        truncated: boolean;
        cursor:    string | null;
      };
      const more: GalleryFile[] = (data.items ?? [])
        .filter(item => !newUploads.some(n => n.publicId === item.publicId))
        .map(item => ({
          publicId:   item.publicId,
          url:        item.url,
          size:       item.size,
          name:       nameFromPublicId(item.publicId),
          uploadedAt: item.uploadedAt
        }));
      gallery   = [...gallery, ...more];
      truncated = data.truncated ?? false;
      cursor    = data.cursor ?? null;
    } catch {
      loadMoreError = 'Network error — could not load more files';
    } finally {
      loadingMore = false;
    }
  }

  $: allFiles = [...newUploads, ...gallery];
  $: total    = allFiles.length;
</script>

<svelte:head>
  <title>Files — Notion Clone</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
  <!-- Header -->
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
      <a
        href="/"
        class="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      >
        ← Home
      </a>
      <div class="h-4 w-px bg-slate-200"></div>
      <h1 class="text-lg font-semibold text-slate-800">File Manager</h1>
      <span class="ml-auto rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
        Cloudinary
      </span>
    </div>
  </header>

  <main class="mx-auto max-w-4xl px-6 py-8 space-y-8">

    <!-- Upload section -->
    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="mb-1 text-base font-semibold text-slate-800">Upload Files</h2>
      <p class="mb-5 text-sm text-slate-500">
        Drag &amp; drop or click to select — files are stored on Cloudinary and the URL is saved to your database.
      </p>
      <FileUpload folder="notion-clone" on:uploaded={onUploaded} />
    </section>

    <!-- Load error banner -->
    {#if loadError}
      <div class="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
        <span class="text-lg">⚠️</span>
        <div>
          <strong class="font-semibold">Could not load existing files:</strong>
          {loadError} — files uploaded this session will still appear below.
        </div>
      </div>
    {/if}

    <!-- Gallery -->
    {#if total > 0}
      <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-base font-semibold text-slate-800">
            All Files
            <span class="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {total}{truncated ? '+' : ''}
            </span>
          </h2>
          {#if newUploads.length > 0}
            <span class="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              {newUploads.length} new
            </span>
          {/if}
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {#each allFiles as file (file.publicId)}
            {@const isDeleting   = deletingId === file.publicId}
            {@const isConfirming = confirmId  === file.publicId}
            {@const isNew        = newUploads.some(n => n.publicId === file.publicId)}

            <div class="group relative overflow-hidden rounded-xl border bg-slate-50 transition-shadow hover:shadow-md
              {isNew ? 'border-violet-300 ring-1 ring-violet-200' : 'border-slate-200'}
              {isDeleting ? 'opacity-50 pointer-events-none' : ''}">

              <!-- Preview -->
              <div class="aspect-square w-full overflow-hidden bg-slate-100">
                {#if isImageUrl(file.url)}
                  <img
                    src={file.url}
                    alt={file.name}
                    class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105
                      {isDeleting ? 'blur-sm' : ''}"
                    loading="lazy"
                  />
                {:else}
                  <div class="flex h-full w-full items-center justify-center text-4xl">📁</div>
                {/if}
              </div>

              <!-- Filename + size -->
              <div class="px-2 py-1.5">
                <p class="truncate text-xs font-medium text-slate-700" title={file.name}>{file.name}</p>
                {#if file.size > 0}
                  <p class="text-[10px] text-slate-400">{formatBytes(file.size)}</p>
                {/if}
              </div>

              <!-- New badge -->
              {#if isNew}
                <span class="absolute left-1.5 top-1.5 rounded-full bg-violet-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
                  New
                </span>
              {/if}

              <!-- Deleting spinner -->
              {#if isDeleting}
                <div class="absolute inset-0 flex items-center justify-center bg-white/80">
                  <div class="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-red-500"></div>
                </div>
              {/if}

              <!-- Delete confirm overlay -->
              {#if isConfirming}
                <div class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 p-3">
                  <p class="text-center text-xs font-semibold text-white leading-tight">
                    Delete from Cloudinary?
                  </p>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-red-600 transition-colors"
                      on:click={() => confirmDelete(file.publicId)}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      class="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow hover:bg-white transition-colors"
                      on:click={cancelDelete}
                    >
                      Cancel
                    </button>
                  </div>
                </div>

              <!-- Normal hover actions -->
              {:else if !isDeleting}
                <div class="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity duration-150 group-hover:opacity-100 p-2">
                  <button
                    type="button"
                    class="w-full rounded-lg bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 shadow hover:bg-violet-50 transition-colors"
                    on:click={() => copyUrl(file.url, file.publicId)}
                  >
                    {copiedId === file.publicId ? '✓ Copied!' : 'Copy URL'}
                  </button>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="w-full rounded-lg bg-white/90 px-2 py-1.5 text-center text-xs font-semibold text-slate-700 shadow hover:bg-violet-50 transition-colors"
                  >
                    Open ↗
                  </a>
                  <button
                    type="button"
                    class="w-full rounded-lg bg-red-500/90 px-2 py-1.5 text-xs font-semibold text-white shadow hover:bg-red-600 transition-colors"
                    on:click={() => requestDelete(file.publicId)}
                  >
                    🗑 Delete
                  </button>
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Load more -->
        {#if truncated}
          <div class="mt-6 flex flex-col items-center gap-2">
            {#if loadMoreError}
              <p class="text-xs text-red-500">{loadMoreError}</p>
            {/if}
            <button
              type="button"
              disabled={loadingMore}
              class="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              on:click={loadMore}
            >
              {#if loadingMore}
                <span class="inline-flex items-center gap-2">
                  <span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500"></span>
                  Loading…
                </span>
              {:else}
                Load more
              {/if}
            </button>
          </div>
        {/if}
      </section>

    <!-- Empty state -->
    {:else if !loadError}
      <div class="flex flex-col items-center gap-3 py-8 text-center text-slate-400">
        <span class="text-5xl">🗂️</span>
        <p class="text-sm">No files yet — upload something above and it will appear here.</p>
      </div>
    {/if}

  </main>
</div>
