<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let maxFiles: number = 20;
  export let accept: string = '*/*';
  export let folder: string = 'notion-clone';

  type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

  interface FileItem {
    id:        string;
    file:      File;
    status:    UploadStatus;
    progress:  number;
    url?:      string;
    publicId?: string;
    error?:    string;
    preview?:  string;
  }

  const dispatch = createEventDispatcher<{
    uploaded: { url: string; publicId: string; name: string };
  }>();

  let dragging     = false;
  let fileInput: HTMLInputElement;
  let items: FileItem[] = [];
  let copiedId: string | null = null;

  function fileIcon(file: File): string {
    const t = file.type;
    if (t.startsWith('image/')) return '🖼️';
    if (t.startsWith('video/')) return '🎬';
    if (t.startsWith('audio/')) return '🎵';
    if (t === 'application/pdf') return '📄';
    if (t.includes('zip') || t.includes('compressed')) return '🗜️';
    if (t.includes('word') || t.includes('document')) return '📝';
    if (t.includes('sheet') || t.includes('excel')) return '📊';
    return '📁';
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function makePreview(file: File): Promise<string | undefined> {
    if (!file.type.startsWith('image/')) return Promise.resolve(undefined);
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(file);
    });
  }

  async function enqueue(files: FileList | File[]) {
    const arr = Array.from(files).slice(0, maxFiles - items.length);
    const newItems: FileItem[] = await Promise.all(
      arr.map(async (file) => ({
        id:       crypto.randomUUID(),
        file,
        status:   'pending' as UploadStatus,
        progress: 0,
        preview:  await makePreview(file)
      }))
    );
    items = [...items, ...newItems];
    newItems.forEach(item => uploadFile(item));
  }

  async function uploadFile(item: FileItem) {
    items = items.map(i => i.id === item.id ? { ...i, status: 'uploading', progress: 0 } : i);

    const fakeProgress = setInterval(() => {
      items = items.map(i =>
        i.id === item.id && i.progress < 80
          ? { ...i, progress: i.progress + Math.random() * 12 }
          : i
      );
    }, 200);

    try {
      const form = new FormData();
      form.append('file', item.file);
      form.append('folder', folder);

      const res = await fetch('/api/files', { method: 'POST', body: form });
      clearInterval(fakeProgress);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        items = items.map(i =>
          i.id === item.id
            ? { ...i, status: 'error', progress: 0, error: err.error ?? 'Upload failed' }
            : i
        );
        return;
      }

      const data = await res.json();
      items = items.map(i =>
        i.id === item.id
          ? { ...i, status: 'success', progress: 100, url: data.url, publicId: data.publicId }
          : i
      );
      dispatch('uploaded', { url: data.url, publicId: data.publicId, name: item.file.name });
    } catch (err: any) {
      clearInterval(fakeProgress);
      items = items.map(i =>
        i.id === item.id
          ? { ...i, status: 'error', progress: 0, error: err.message ?? 'Network error' }
          : i
      );
    }
  }

  function retry(item: FileItem) {
    uploadFile(item);
  }

  function remove(id: string) {
    items = items.filter(i => i.id !== id);
  }

  async function copyUrl(url: string, id: string) {
    await navigator.clipboard.writeText(url).catch(() => {});
    copiedId = id;
    setTimeout(() => { copiedId = null; }, 2000);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    dragging = true;
  }

  function onDragLeave() {
    dragging = false;
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    if (e.dataTransfer?.files) enqueue(e.dataTransfer.files);
  }

  function onInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) enqueue(input.files);
    input.value = '';
  }

  $: successItems   = items.filter(i => i.status === 'success');
  $: pendingItems   = items.filter(i => i.status !== 'success');
</script>

<div class="space-y-4">
  <!-- Drop zone -->
  <button
    type="button"
    class="relative w-full rounded-2xl border-2 border-dashed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500
      {dragging
        ? 'border-violet-400 bg-violet-50 scale-[1.01]'
        : 'border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/30'}"
    on:dragover={onDragOver}
    on:dragleave={onDragLeave}
    on:drop={onDrop}
    on:click={() => fileInput.click()}
    on:keydown={(e) => e.key === 'Enter' && fileInput.click()}
  >
    <div class="flex flex-col items-center justify-center gap-3 py-12 px-6">
      <div class="text-4xl {dragging ? 'scale-110' : ''} transition-transform duration-200">
        {dragging ? '📂' : '☁️'}
      </div>
      <div class="text-center">
        <p class="font-medium text-slate-700">
          {dragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p class="mt-1 text-sm text-slate-500">
          or <span class="text-violet-600 font-medium">click to browse</span> — up to {maxFiles} files
        </p>
      </div>
    </div>
    <input
      bind:this={fileInput}
      type="file"
      {accept}
      multiple
      class="sr-only"
      on:change={onInputChange}
    />
  </button>

  <!-- Upload queue (pending / uploading / error) -->
  {#if pendingItems.length > 0}
    <div class="space-y-2">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Uploading</p>
      {#each pendingItems as item (item.id)}
        <div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <!-- Thumbnail / icon -->
          <div class="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
            {#if item.preview}
              <img src={item.preview} alt={item.file.name} class="h-full w-full object-cover" />
            {:else}
              <div class="flex h-full w-full items-center justify-center text-xl">{fileIcon(item.file)}</div>
            {/if}
          </div>

          <!-- Info + progress -->
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-slate-700">{item.file.name}</p>
            <p class="text-xs text-slate-400">{formatSize(item.file.size)}</p>
            {#if item.status === 'uploading'}
              <div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-violet-500 transition-all duration-300"
                  style="width: {item.progress}%"
                ></div>
              </div>
            {:else if item.status === 'error'}
              <p class="mt-0.5 text-xs text-red-500">{item.error}</p>
            {/if}
          </div>

          <!-- Status / actions -->
          <div class="flex items-center gap-1">
            {#if item.status === 'uploading'}
              <span class="text-xs text-violet-500 font-medium">{Math.round(item.progress)}%</span>
            {:else if item.status === 'error'}
              <button
                type="button"
                class="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                on:click={() => retry(item)}
              >Retry</button>
            {:else if item.status === 'pending'}
              <span class="text-xs text-slate-400">Queued</span>
            {/if}
            <button
              type="button"
              class="ml-1 rounded-lg p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500"
              on:click={() => remove(item.id)}
              aria-label="Remove"
            >✕</button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Uploaded files grid -->
  {#if successItems.length > 0}
    <div class="space-y-2">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Uploaded ({successItems.length})</p>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {#each successItems as item (item.id)}
          <div class="group relative flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <!-- Thumbnail / icon -->
            <div class="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
              {#if item.preview}
                <img src={item.preview} alt={item.file.name} class="h-full w-full object-cover" />
              {:else}
                <div class="flex h-full w-full items-center justify-center text-xl">{fileIcon(item.file)}</div>
              {/if}
            </div>

            <!-- Info -->
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-slate-700">{item.file.name}</p>
              <p class="text-xs text-slate-400">{formatSize(item.file.size)}</p>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1">
              <span class="text-green-500 text-sm">✓</span>
              {#if item.url}
                <button
                  type="button"
                  class="rounded-lg px-2 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 transition-colors"
                  on:click={() => copyUrl(item.url!, item.id)}
                >
                  {copiedId === item.id ? '✓ Copied' : 'Copy URL'}
                </button>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="rounded-lg p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500 text-sm"
                  aria-label="Open file"
                >↗</a>
              {/if}
              <button
                type="button"
                class="rounded-lg p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500"
                on:click={() => remove(item.id)}
                aria-label="Remove"
              >✕</button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
