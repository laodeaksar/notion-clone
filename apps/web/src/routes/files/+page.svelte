<script lang="ts">
  import FileUpload from '$lib/components/FileUpload.svelte';

  interface UploadedFile {
    url:      string;
    publicId: string;
    name:     string;
    addedAt:  Date;
  }

  let session:   UploadedFile[] = [];
  let copiedId:  string | null  = null;
  let deletingId: string | null = null;
  let confirmId:  string | null = null;

  function onUploaded(e: CustomEvent<{ url: string; publicId: string; name: string }>) {
    session = [{ ...e.detail, addedAt: new Date() }, ...session];
  }

  function isImage(url: string): boolean {
    return /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(url)
      || url.includes('/image/upload/');
  }

  async function copyUrl(url: string, id: string) {
    await navigator.clipboard.writeText(url).catch(() => {});
    copiedId = id;
    setTimeout(() => { copiedId = null; }, 2000);
  }

  function requestDelete(publicId: string) {
    confirmId = publicId;
  }

  function cancelDelete() {
    confirmId = null;
  }

  async function confirmDelete(publicId: string) {
    confirmId  = null;
    deletingId = publicId;

    try {
      const res = await fetch(`/api/files?publicId=${encodeURIComponent(publicId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        session = session.filter(f => f.publicId !== publicId);
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

    <!-- Session uploads -->
    {#if session.length > 0}
      <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-base font-semibold text-slate-800">
            Uploaded this session
            <span class="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {session.length}
            </span>
          </h2>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {#each session as file (file.publicId)}
            {@const isDeleting = deletingId === file.publicId}
            {@const isConfirming = confirmId === file.publicId}

            <div class="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50
              {isDeleting ? 'opacity-50 pointer-events-none' : ''}">

              <!-- Preview -->
              <div class="aspect-square w-full overflow-hidden bg-slate-100">
                {#if isImage(file.url)}
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

              <!-- Filename -->
              <div class="p-2">
                <p class="truncate text-xs font-medium text-slate-600">{file.name}</p>
              </div>

              <!-- Deleting spinner overlay -->
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
      </section>
    {/if}

    <!-- Empty state -->
    {#if session.length === 0}
      <div class="flex flex-col items-center gap-3 py-8 text-center text-slate-400">
        <span class="text-5xl">🗂️</span>
        <p class="text-sm">Files you upload will appear here with a shareable Cloudinary URL.</p>
      </div>
    {/if}

  </main>
</div>
