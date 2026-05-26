<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { Editor, Extension } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Placeholder from '@tiptap/extension-placeholder';
  import Collaboration from '@tiptap/extension-collaboration';
  import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
  import Link from '@tiptap/extension-link';
  import Image from '@tiptap/extension-image';
  import { HocuspocusProvider } from '@hocuspocus/provider';
  import * as Y from 'yjs';
  import { IndexeddbPersistence } from 'y-indexeddb';

  interface PageData {
    page?:          { id: string; title?: string } | null;
    user?:          { id: string; email: string; name: string | null } | null;
    hocuspocusUrl?: string;
  }

  let { data }: { data: PageData } = $props();

  let editorContainer: HTMLDivElement | null      = null;
  let fileInput: HTMLInputElement | null           = null;
  let editor: Editor | null                        = null;
  let provider: HocuspocusProvider | null         = null;
  let persistence: IndexeddbPersistence | null    = null;

  let showSlashMenu = $state(false);
  let activeIndex   = $state(0);
  let menuPosition  = $state({ top: 0, left: 0 });

  let cursorName:  string  = $state('Anonymous');
  let cursorColor: string  = $state('#7C3AED');
  let editingName: boolean = $state(false);
  let nameInput:   string  = $state('');

  const CURSOR_COLORS = [
    '#7C3AED', '#2563EB', '#059669', '#D97706',
    '#DC2626', '#DB2777', '#0891B2', '#65A30D'
  ];

  function initIdentity() {
    const loggedInUser = data?.user as { id: string; email: string; name: string | null } | null | undefined;

    if (loggedInUser) {
      cursorName  = loggedInUser.name ?? loggedInUser.email;
      cursorColor = CURSOR_COLORS[Math.abs(hashStr(loggedInUser.id)) % CURSOR_COLORS.length];
      return;
    }

    if (typeof sessionStorage === 'undefined') return;
    const stored = sessionStorage.getItem('editor-identity');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        cursorName  = parsed.name  ?? 'Anonymous';
        cursorColor = parsed.color ?? '#7C3AED';
        return;
      } catch {}
    }
    const adjectives = ['Swift', 'Brave', 'Calm', 'Keen', 'Bold', 'Wise', 'Bright', 'Quick'];
    const animals    = ['Fox', 'Owl', 'Bear', 'Wolf', 'Hawk', 'Lynx', 'Deer', 'Mole'];
    cursorName  = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${animals[Math.floor(Math.random() * animals.length)]}`;
    cursorColor = CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
    sessionStorage.setItem('editor-identity', JSON.stringify({ name: cursorName, color: cursorColor }));
  }

  function hashStr(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; }
    return h;
  }

  function saveName() {
    const trimmed = nameInput.trim();
    if (trimmed) {
      cursorName = trimmed;
      if (!data?.user) {
        sessionStorage.setItem('editor-identity', JSON.stringify({ name: cursorName, color: cursorColor }));
      }
      provider?.setAwarenessField('user', { name: cursorName, color: cursorColor });
    }
    editingName = false;
  }

  const slashItems = [
    { icon: 'H1', label: 'Heading 1',     action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
    { icon: 'H2', label: 'Heading 2',     action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { icon: '•',  label: 'Bullet List',   action: () => editor?.chain().focus().toggleBulletList().run() },
    { icon: '1.', label: 'Numbered List', action: () => editor?.chain().focus().toggleOrderedList().run() },
    { icon: '🖼', label: 'Image',          action: () => fileInput?.click() }
  ];

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const updateSlashMenu = () => {
    if (!editor) return;
    const { state } = editor;
    const from       = state.selection.from;
    const charBefore = state.doc.textBetween(Math.max(0, from - 1), from, undefined, '\uFFFC');
    const wasOpen    = showSlashMenu;
    showSlashMenu    = charBefore === '/';
    if (!wasOpen && showSlashMenu) activeIndex = 0;
    if (showSlashMenu && editorContainer) {
      const coords        = editor.view.coordsAtPos(from);
      const containerRect = editorContainer.getBoundingClientRect();
      menuPosition = {
        top:  coords.bottom - containerRect.top + 4,
        left: coords.left   - containerRect.left
      };
    }
  };

  const insertSlashCommand = async (command: typeof slashItems[number]) => {
    showSlashMenu = false;
    if (!editor) return;
    const from = editor.state.selection.from;
    editor.chain().focus().deleteRange({ from: from - 1, to: from }).run();
    await command.action();
    editor.commands.focus();
  };

  const handleFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file || !editor) return;
    const { default: imageCompression } = await import('browser-image-compression');
    const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true });
    const base64      = await toBase64(compressed);
    const response    = await fetch('/api/upload', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ data: base64 })
    });
    if (!response.ok) return;
    const payload = await response.json();
    editor.chain().focus().setImage({ src: payload.url, alt: file.name }).run();
    input.value = '';
  };

  onMount(() => {
    initIdentity();

    const pageId = data.page?.id || 'page';
    const ydoc   = new Y.Doc();

    // Persist document locally in IndexedDB so content loads instantly offline
    persistence = new IndexeddbPersistence(`page-${pageId}`, ydoc);

    provider = new HocuspocusProvider({
      url:      data.hocuspocusUrl ?? 'ws://localhost:1234',
      document: ydoc,
      name:     pageId
    });

    const SlashMenuKeyboard = Extension.create({
      name: 'slashMenuKeyboard',
      addKeyboardShortcuts() {
        return {
          ArrowDown: () => {
            if (!showSlashMenu) return false;
            activeIndex = (activeIndex + 1) % slashItems.length;
            return true;
          },
          ArrowUp: () => {
            if (!showSlashMenu) return false;
            activeIndex = (activeIndex - 1 + slashItems.length) % slashItems.length;
            return true;
          },
          Enter: () => {
            if (!showSlashMenu) return false;
            insertSlashCommand(slashItems[activeIndex]);
            return true;
          },
          Escape: () => {
            if (!showSlashMenu) return false;
            showSlashMenu = false;
            activeIndex   = 0;
            return true;
          }
        };
      }
    });

    editor = new Editor({
      element:    editorContainer as HTMLElement,
      extensions: [
        StarterKit.configure({ history: false, link: false }),
        Placeholder.configure({ placeholder: 'Start writing...' }),
        Link,
        Image,
        Collaboration.configure({ document: ydoc.get('prosemirror', Y.XmlFragment) }),
        CollaborationCursor.configure({ provider, user: { name: cursorName, color: cursorColor } }),
        SlashMenuKeyboard
      ],
      onUpdate:          updateSlashMenu,
      onSelectionUpdate: updateSlashMenu
    });
  });

  onDestroy(() => {
    persistence?.destroy();
    provider?.destroy();
    editor?.destroy();
  });
</script>

<div class="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

  <!-- Identity bar -->
  <div class="mb-4 flex items-center gap-2">
    <span class="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full" style="background:{cursorColor}"></span>
    {#if editingName}
      <form class="flex items-center gap-1.5" onsubmit={(e) => { e.preventDefault(); saveName(); }}>
        <input
          type="text"
          bind:value={nameInput}
          maxlength={32}
          placeholder="Your display name"
          autofocus
          class="rounded-lg border border-slate-300 px-2 py-0.5 text-xs text-slate-700 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300"
        />
        <button type="submit" class="rounded-lg bg-violet-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors">
          Save
        </button>
        <button type="button" class="rounded-lg px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100 transition-colors" onclick={() => { editingName = false; }}>
          Cancel
        </button>
      </form>
    {:else}
      <span class="text-xs text-slate-500">
        {#if data?.user}
          Signed in as <strong class="font-semibold text-slate-700">{cursorName}</strong>
        {:else}
          You are <strong class="font-semibold text-slate-700">{cursorName}</strong>
        {/if}
      </span>
      {#if !data?.user}
        <button
          type="button"
          class="rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          onclick={() => { nameInput = cursorName; editingName = true; }}
        >Change</button>
      {/if}
    {/if}
  </div>

  <div bind:this={editorContainer} class="prose max-w-none min-h-[480px] outline-none"></div>
  <input type="file" accept="image/*" bind:this={fileInput} class="hidden" onchange={handleFileChange} />

  {#if showSlashMenu}
    <div
      class="absolute z-20 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
      style="top: {menuPosition.top}px; left: {menuPosition.left}px;"
    >
      <div class="px-2 pt-2 pb-1">
        <p class="px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Insert block</p>
      </div>
      <div class="p-1.5 pt-0">
        {#each slashItems as item, index}
          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-colors
              {activeIndex === index ? 'bg-violet-50 text-violet-700' : 'hover:bg-slate-50'}"
            onclick={() => insertSlashCommand(item)}
            onmouseenter={() => { activeIndex = index; }}
          >
            <span class="w-5 text-center font-mono text-xs text-slate-400">{item.icon}</span>
            {item.label}
          </button>
        {/each}
      </div>
      <div class="border-t border-slate-100 px-3 py-1.5">
        <p class="text-[10px] text-slate-300">↑↓ navigate · Enter select · Esc close</p>
      </div>
    </div>
  {/if}
</div>
