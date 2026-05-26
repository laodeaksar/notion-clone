<script lang="ts">
  import Editor from '$lib/components/Editor.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<main class="p-6">
  <h1 class="mb-4 text-2xl font-semibold text-slate-900">{data.page?.title ?? 'Untitled'}</h1>
  <Editor {data} />
</main>
