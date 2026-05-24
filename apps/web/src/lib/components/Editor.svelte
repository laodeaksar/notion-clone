<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Placeholder from '@tiptap/extension-placeholder';
  import Collaboration from '@tiptap/extension-collaboration';
  import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
  import Link from '@tiptap/extension-link';
  import Image from '@tiptap/extension-image';
  import { HocuspocusProvider } from '@hocuspocus/provider';
  import * as Y from 'yjs';
  import { PUBLIC_API_GATEWAY_URL, PUBLIC_HOCUSPOCUS_URL } from '$env/static/public';

  export let data: any;
  let editorContainer: HTMLDivElement | null = null;
  let fileInput: HTMLInputElement | null = null;
  let editor: Editor | null = null;
  let provider: HocuspocusProvider | null = null;
  let showSlashMenu = false;
  let activeIndex = 0;
  let menuPosition = { top: 0, left: 0 };

  const slashItems = [
    { label: 'Heading 1', action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: 'Heading 2', action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Bullet List', action: () => editor?.chain().focus().toggleBulletList().run() },
    { label: 'Numbered List', action: () => editor?.chain().focus().toggleOrderedList().run() },
    { label: 'Image', action: () => fileInput?.click() }
  ];

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const updateSlashMenu = () => {
    if (!editor) return;
    const { state } = editor;
    const from = state.selection.from;
    const charBefore = state.doc.textBetween(Math.max(0, from - 1), from, undefined, '\uFFFC');
    showSlashMenu = charBefore === '/';
    if (showSlashMenu && editorContainer) {
      const rect = editorContainer.getBoundingClientRect();
      menuPosition = { top: rect.top + 40, left: rect.left + 16 };
    }
  };

  const insertSlashCommand = async (command: typeof slashItems[number]) => {
    showSlashMenu = false;
    if (!editor) return;
    const { state } = editor;
    const from = state.selection.from;
    editor.chain().focus().deleteRange({ from: from - 1, to: from }).run();
    await command.action();
    editor.commands.focus();
  };

  const handleFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !editor) return;
    const { default: imageCompression } = await import('browser-image-compression');
    const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true });
    const base64 = await toBase64(compressed);
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: base64 })
    });
    if (!response.ok) return;
    const payload = await response.json();
    editor.chain().focus().setImage({ src: payload.url, alt: file.name }).run();
    input.value = '';
  };

  onMount(() => {
    const ydoc = new Y.Doc();
    provider = new HocuspocusProvider({ url: PUBLIC_HOCUSPOCUS_URL as any, document: ydoc, name: data.page?.id || 'page' });
    editor = new Editor({
      element: editorContainer as HTMLElement,
      extensions: [
        StarterKit,
        Placeholder.configure({ placeholder: 'Start writing...' }),
        Link,
        Image,
        Collaboration.configure({ document: ydoc.get('prosemirror', Y.XmlFragment) }),
        CollaborationCursor.configure({ provider, user: { name: data.page?.title || 'Anonymous', color: '#7C3AED' } })
      ],
      content: data.page?.content ?? '<p></p>',
      onUpdate: updateSlashMenu
    });
  });

  onDestroy(() => {
    provider?.destroy();
    editor?.destroy();
  });
</script>

<div class="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
  <div bind:this={editorContainer} class="prose max-w-none min-h-[480px] outline-none"></div>
  <input type="file" accept="image/*" bind:this={fileInput} class="hidden" on:change={handleFileChange} />
  {#if showSlashMenu}
    <div class="absolute z-20 w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg" style="top: {menuPosition.top}px; left: {menuPosition.left}px;">
      {#each slashItems as item, index}
        <button
          type="button"
          class="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 {activeIndex === index ? 'bg-slate-100' : ''}"
          on:click={() => insertSlashCommand(item)}>
          {item.label}
        </button>
      {/each}
    </div>
  {/if}
</div>
