<script lang="ts">
  export let data: { page: any };
  import Editor from '$lib/components/Editor.svelte';
</script>

<main class="p-6">
  <h1 class="text-2xl font-semibold">{data.page?.title ?? 'Untitled'}</h1>
  <Editor {data} />
</main>
