<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { Editor, Extension }  from '@tiptap/core';
  import StarterKit              from '@tiptap/starter-kit';
  import Placeholder             from '@tiptap/extension-placeholder';
  import Collaboration           from '@tiptap/extension-collaboration';
  import CollaborationCursor     from '@tiptap/extension-collaboration-cursor';
  import Link                    from '@tiptap/extension-link';
  import Image                   from '@tiptap/extension-image';
  import { createClient }        from '@liveblocks/client';
  import LiveblocksProvider      from '@liveblocks/yjs';
  import * as Y                  from 'yjs';
  import { IndexeddbPersistence } from 'y-indexeddb';
  import { CommentMark }         from '$lib/editor/CommentMark';
  import CommentPopover          from '$lib/components/CommentPopover.svelte';
  import CommentsSidebar, { type PageComment } from '$lib/components/CommentsSidebar.svelte';

  interface PageData {
    page?:         { id: string; title?: string } | null;
    user?:         { id: string; email: string; name: string | null } | null;
    sessionToken?: string | null;
  }

  type OtherUser = {
    connectionId: number;
    name:         string;
    color:        string;
    initials:     string;
  };

  type Toast = {
    id:       number;
    name:     string;
    initials: string;
    color:    string;
    kind:     'join' | 'leave';
    visible:  boolean;
  };

  let { data }: { data: PageData } = $props();

  let editorContainer: HTMLDivElement | null         = null;
  let fileInput:        HTMLInputElement | null       = null;
  let editor:           Editor | null                = null;
  let provider:         LiveblocksProvider | null    = null;
  let persistence:      IndexeddbPersistence | null  = null;
  let client:           ReturnType<typeof createClient> | null = null;
  let leaveRoom:        (() => void) | null          = null;

  let showSlashMenu = $state(false);
  let activeIndex   = $state(0);
  let menuPosition  = $state({ top: 0, left: 0 });

  let cursorName:  string      = $state('Anonymous');
  let cursorColor: string      = $state('#7C3AED');
  let editingName: boolean     = $state(false);
  let nameInput:   string      = $state('');
  let others:      OtherUser[] = $state([]);
  let tooltipId:   number | null = $state(null);
  let toasts:      Toast[]     = $state([]);

  // ── Comments state ──────────────────────────────────────────────────────────
  let comments:        PageComment[] = $state([]);
  let activeCommentId: string | null = $state(null);
  let showSidebar:     boolean       = $state(false);

  let toastCounter = 0;

  const MAX_AVATARS   = 3;
  const TOAST_TIMEOUT = 3500;
  const FADE_DELAY    = 300;

  const CURSOR_COLORS = [
    '#7C3AED', '#2563EB', '#059669', '#D97706',
    '#DC2626', '#DB2777', '#0891B2', '#65A30D'
  ];

  function hashStr(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; }
    return h;
  }

  function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function colorForId(id: string): string {
    return CURSOR_COLORS[Math.abs(hashStr(id)) % CURSOR_COLORS.length];
  }

  // ── Toast helpers ────────────────────────────────────────────────────────────

  function pushToast(name: string, color: string, kind: 'join' | 'leave') {
    const id: number = ++toastCounter;
    const toast: Toast = { id, name, initials: getInitials(name), color, kind, visible: false };
    toasts = [...toasts, toast];
    setTimeout(() => { toasts = toasts.map(t => t.id === id ? { ...t, visible: true } : t); }, 16);
    setTimeout(() => {
      toasts = toasts.map(t => t.id === id ? { ...t, visible: false } : t);
      setTimeout(() => { toasts = toasts.filter(t => t.id !== id); }, FADE_DELAY);
    }, TOAST_TIMEOUT);
  }

  function dismissToast(id: number) {
    toasts = toasts.map(t => t.id === id ? { ...t, visible: false } : t);
    setTimeout(() => { toasts = toasts.filter(t => t.id !== id); }, FADE_DELAY);
  }

  // ── Identity ─────────────────────────────────────────────────────────────────

  function initIdentity() {
    const loggedInUser = data?.user as { id: string; email: string; name: string | null } | null | undefined;
    if (loggedInUser) {
      cursorName  = loggedInUser.name ?? loggedInUser.email;
      cursorColor = colorForId(loggedInUser.id);
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

  function saveName() {
    const trimmed = nameInput.trim();
    if (trimmed) {
      cursorName = trimmed;
      if (!data?.user) {
        sessionStorage.setItem('editor-identity', JSON.stringify({ name: cursorName, color: cursorColor }));
      }
      provider?.awareness.setLocalStateField('user', { name: cursorName, color: cursorColor });
    }
    editingName = false;
  }

  // ── Comments API ─────────────────────────────────────────────────────────────

  async function loadComments(pageId: string) {
    try {
      const res = await fetch(`/api/comments?pageId=${encodeURIComponent(pageId)}`);
      if (!res.ok) return;
      const { comments: list } = await res.json();
      comments = list ?? [];
    } catch (err) {
      console.error('[Editor] loadComments error:', err);
    }
  }

  function handleCommentCreated(commentId: string) {
    const pageId = data.page?.id;
    if (pageId) loadComments(pageId);
    activeCommentId = commentId;
    showSidebar     = true;
  }

  function handleCommentResolved(commentId: string) {
    comments = comments.filter(c => c.id !== commentId);
  }

  function handleCommentDeleted(commentId: string) {
    comments = comments.filter(c => c.id !== commentId);
    if (activeCommentId === commentId) activeCommentId = null;
  }

  // ── Slash menu ────────────────────────────────────────────────────────────────

  const slashItems = [
    { icon: 'H1', label: 'Heading 1',     action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
    { icon: 'H2', label: 'Heading 2',     action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { icon: '•',  label: 'Bullet List',   action: () => editor?.chain().focus().toggleBulletList().run() },
    { icon: '1.', label: 'Numbered List', action: () => editor?.chain().focus().toggleOrderedList().run() },
    { icon: '🖼', label: 'Image',          action: () => fileInput?.click() }
  ];

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader  = new FileReader();
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

    persistence = new IndexeddbPersistence(`page-${pageId}`, ydoc);

    client = createClient({
      authEndpoint: async () => {
        const res = await fetch('/api/liveblocks-auth', {
          method:  'POST',
          headers: { 'content-type': 'application/json' },
          body:    JSON.stringify({ room: pageId })
        });
        return res.json();
      }
    });

    const { room, leave } = client.enterRoom(pageId);
    leaveRoom = leave;

    // ── Presence (join / leave toasts) ────────────────────────────────────────
    let prevIds       = new Set<number>();
    let isFirstUpdate = true;

    const unsubOthers = room.subscribe('others', (lbOthers) => {
      const nextMap = new Map<number, OtherUser>();
      for (const o of lbOthers) {
        const name  = (o.info as any)?.name ?? `User ${o.connectionId}`;
        const color = colorForId(String(o.id ?? o.connectionId));
        nextMap.set(o.connectionId, { connectionId: o.connectionId, name, color, initials: getInitials(name) });
      }
      if (!isFirstUpdate) {
        for (const [connId, user] of nextMap) {
          if (!prevIds.has(connId)) pushToast(user.name, user.color, 'join');
        }
        for (const connId of prevIds) {
          if (!nextMap.has(connId)) {
            const prev  = others.find(o => o.connectionId === connId);
            const name  = prev?.name  ?? 'Someone';
            const color = prev?.color ?? '#94A3B8';
            pushToast(name, color, 'leave');
          }
        }
      }
      isFirstUpdate = false;
      prevIds = new Set(nextMap.keys());
      others  = Array.from(nextMap.values());
    });

    provider = new LiveblocksProvider(room, ydoc);
    provider.awareness.setLocalStateField('user', { name: cursorName, color: cursorColor });

    // ── TipTap ─────────────────────────────────────────────────────────────────
    const SlashMenuKeyboard = Extension.create({
      name: 'slashMenuKeyboard',
      addKeyboardShortcuts() {
        return {
          ArrowDown: () => { if (!showSlashMenu) return false; activeIndex = (activeIndex + 1) % slashItems.length; return true; },
          ArrowUp:   () => { if (!showSlashMenu) return false; activeIndex = (activeIndex - 1 + slashItems.length) % slashItems.length; return true; },
          Enter:     () => { if (!showSlashMenu) return false; insertSlashCommand(slashItems[activeIndex]); return true; },
          Escape:    () => { if (!showSlashMenu) return false; showSlashMenu = false; activeIndex = 0; return true; }
        };
      }
    });

    editor = new Editor({
      element:    editorContainer as HTMLElement,
      extensions: [
        StarterKit.configure({ history: false, link: false }),
        Placeholder.configure({ placeholder: 'Start writing…' }),
        Link,
        Image,
        CommentMark,
        Collaboration.configure({ document: ydoc }),
        CollaborationCursor.configure({ provider, user: { name: cursorName, color: cursorColor } }),
        SlashMenuKeyboard
      ],
      onUpdate:          updateSlashMenu,
      onSelectionUpdate: updateSlashMenu
    });

    // ── Detect comment mark clicks ─────────────────────────────────────────────
    editorContainer?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const mark   = target.closest('mark[data-comment-id]') as HTMLElement | null;
      if (mark) {
        const cid = mark.dataset.commentId ?? null;
        activeCommentId = cid;
        showSidebar     = true;
      }
    });

    // ── Load comments ─────────────────────────────────────────────────────────
    loadComments(pageId);

    return () => { unsubOthers(); };
  });

  onDestroy(() => {
    persistence?.destroy();
    provider?.destroy();
    editor?.destroy();
    leaveRoom?.();
  });
</script>

<!-- ── Toast portal ──────────────────────────────────────────────────────────── -->
<div class="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-2">
  {#each toasts as toast (toast.id)}
    <div
      class="pointer-events-auto flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg
             transition-all duration-300 ease-out"
      style="opacity:{toast.visible?1:0};transform:translateY({toast.visible?0:12}px) scale({toast.visible?1:0.95})"
    >
      <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm"
           style="background:{toast.color};">{toast.initials}</div>
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold text-slate-800">{toast.name}</p>
        <p class="text-xs {toast.kind==='join'?'text-emerald-600':'text-slate-400'}">
          {toast.kind==='join'?'● joined this page':'○ left this page'}
        </p>
      </div>
      <button type="button"
        class="ml-1 flex-shrink-0 rounded-lg p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors"
        onclick={() => dismissToast(toast.id)} aria-label="Dismiss">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  {/each}
</div>

<!-- ── Main editor card ───────────────────────────────────────────────────────── -->
<div class="rounded-3xl border border-slate-200 bg-white shadow-sm">

  <!-- Identity + presence bar -->
  <div class="flex items-center gap-2 border-b border-slate-100 px-6 py-3">

    <span class="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full" style="background:{cursorColor}"></span>

    {#if editingName}
      <form class="flex items-center gap-1.5" onsubmit={(e) => { e.preventDefault(); saveName(); }}>
        <input type="text" bind:value={nameInput} maxlength={32} placeholder="Your display name" autofocus
          class="rounded-lg border border-slate-300 px-2 py-0.5 text-xs text-slate-700 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300" />
        <button type="submit" class="rounded-lg bg-violet-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors">Save</button>
        <button type="button" class="rounded-lg px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100 transition-colors" onclick={() => { editingName = false; }}>Cancel</button>
      </form>
    {:else}
      <span class="text-xs text-slate-500">
        {#if data?.user}Signed in as <strong class="font-semibold text-slate-700">{cursorName}</strong>
        {:else}You are <strong class="font-semibold text-slate-700">{cursorName}</strong>{/if}
      </span>
      {#if !data?.user}
        <button type="button"
          class="rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          onclick={() => { nameInput = cursorName; editingName = true; }}>Change</button>
      {/if}
    {/if}

    <div class="flex-1"></div>

    <!-- Comment sidebar toggle -->
    <button
      type="button"
      title="Toggle comments"
      onclick={() => { showSidebar = !showSidebar; }}
      class="relative flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors
             {showSidebar ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-100'}"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      Comments
      {#if comments.length > 0}
        <span class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full
                     bg-amber-400 text-[9px] font-bold text-white">{comments.length}</span>
      {/if}
    </button>

    <!-- Presence avatars -->
    {#if others.length > 0}
      <div class="flex items-center gap-1 border-l border-slate-100 pl-3">
        <span class="mr-1 text-[10px] text-slate-400">
          {others.length === 1 ? '1 other' : `${others.length} others`} here
        </span>
        <div class="flex items-center -space-x-2">
          {#each others.slice(0, MAX_AVATARS) as other (other.connectionId)}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="relative flex h-7 w-7 flex-shrink-0 cursor-default items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-sm transition-transform hover:z-10 hover:scale-110"
              style="background:{other.color};"
              onmouseenter={() => { tooltipId = other.connectionId; }}
              onmouseleave={() => { tooltipId = null; }}
            >
              {other.initials}
              {#if tooltipId === other.connectionId}
                <div class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-2 py-1 text-[10px] font-medium text-white shadow-md">
                  {other.name}
                  <div class="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
              {/if}
            </div>
          {/each}
          {#if others.length > MAX_AVATARS}
            <div class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-bold text-slate-600 shadow-sm"
                 title="{others.slice(MAX_AVATARS).map(o=>o.name).join(', ')}">
              +{others.length - MAX_AVATARS}
            </div>
          {/if}
        </div>
        <span class="relative ml-1 flex h-2 w-2">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </span>
      </div>
    {/if}
  </div>

  <!-- Editor body: editor + optional sidebar -->
  <div class="flex min-h-[520px]">

    <!-- Editor area -->
    <div class="relative min-w-0 flex-1 p-6">
      <div bind:this={editorContainer} class="prose max-w-none min-h-[480px] outline-none"></div>
      <input type="file" accept="image/*" bind:this={fileInput} class="hidden" onchange={handleFileChange} />

      <!-- Comment popover (floats above selection) -->
      {#if editor}
        <CommentPopover
          {editor}
          pageId={data.page?.id ?? ''}
          userName={cursorName}
          onCreated={handleCommentCreated}
        />
      {/if}

      <!-- Slash menu -->
      {#if showSlashMenu}
        <div class="absolute z-20 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
             style="top:{menuPosition.top}px;left:{menuPosition.left}px;">
          <div class="px-2 pt-2 pb-1">
            <p class="px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Insert block</p>
          </div>
          <div class="p-1.5 pt-0">
            {#each slashItems as item, index}
              <button type="button"
                class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-colors
                  {activeIndex===index?'bg-violet-50 text-violet-700':'hover:bg-slate-50'}"
                onclick={() => insertSlashCommand(item)}
                onmouseenter={() => { activeIndex = index; }}>
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

    <!-- Comments sidebar -->
    {#if showSidebar}
      <div class="w-72 flex-shrink-0 border-l border-slate-100 bg-slate-50/60">
        <CommentsSidebar
          {comments}
          currentUserId={data?.user?.id ?? null}
          {editor}
          {activeCommentId}
          onResolved={handleCommentResolved}
          onDeleted={handleCommentDeleted}
        />
      </div>
    {/if}
  </div>
</div>
