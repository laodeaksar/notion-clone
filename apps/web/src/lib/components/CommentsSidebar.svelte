<script lang="ts">
  import type { Editor } from '@tiptap/core';

  export type PageComment = {
    id:        string;
    pageId:    string;
    userId:    string | null;
    userName:  string | null;
    quote:     string;
    text:      string;
    resolved:  boolean;
    createdAt: string;
    updatedAt: string;
  };

  type Props = {
    comments:        PageComment[];
    currentUserId:   string | null;
    editor:          Editor | null;
    activeCommentId: string | null;
    onResolved:      (id: string) => void;
    onDeleted:       (id: string) => void;
  };

  let { comments, currentUserId, editor, activeCommentId, onResolved, onDeleted }: Props = $props();

  let resolving: Record<string, boolean> = $state({});
  let deleting:  Record<string, boolean> = $state({});

  function getInitials(name: string | null): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function formatDate(iso: string): string {
    try {
      return new Intl.DateTimeFormat('en', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }).format(new Date(iso));
    } catch { return iso; }
  }

  function scrollToComment(comment: PageComment) {
    if (!editor) return;
    const { doc } = editor.state;
    let found: { from: number; to: number } | null = null;
    doc.descendants((node, pos) => {
      if (found) return false;
      const mark = node.marks.find(
        (m) => m.type.name === 'comment' && m.attrs.commentId === comment.id
      );
      if (mark) {
        found = { from: pos, to: pos + node.nodeSize };
      }
    });
    if (found) {
      editor.chain().focus().setTextSelection(found).run();
      editor.view.dom.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  async function resolve(comment: PageComment) {
    resolving = { ...resolving, [comment.id]: true };
    try {
      const res = await fetch(`/api/comments/${comment.id}/resolve`, { method: 'PATCH' });
      if (res.ok) {
        editor?.commands.unsetCommentMark(comment.id);
        onResolved(comment.id);
      }
    } finally {
      resolving = { ...resolving, [comment.id]: false };
    }
  }

  async function deleteComment(comment: PageComment) {
    deleting = { ...deleting, [comment.id]: true };
    try {
      const res = await fetch(`/api/comments/${comment.id}`, { method: 'DELETE' });
      if (res.ok) {
        editor?.commands.unsetCommentMark(comment.id);
        onDeleted(comment.id);
      }
    } finally {
      deleting = { ...deleting, [comment.id]: false };
    }
  }
</script>

<div class="flex h-full flex-col">
  <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
    <h2 class="text-sm font-semibold text-slate-700">
      Comments
      {#if comments.length > 0}
        <span class="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
          {comments.length}
        </span>
      {/if}
    </h2>
  </div>

  {#if comments.length === 0}
    <div class="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <div class="text-3xl">💬</div>
      <p class="text-sm font-medium text-slate-500">No comments yet</p>
      <p class="text-xs text-slate-400">Select text in the editor and click<br/>"Comment" to add one.</p>
    </div>
  {:else}
    <div class="flex-1 space-y-0 overflow-y-auto divide-y divide-slate-100">
      {#each comments as comment (comment.id)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="group cursor-pointer p-4 transition-colors
                 {activeCommentId === comment.id ? 'bg-amber-50' : 'hover:bg-slate-50'}"
          onclick={() => scrollToComment(comment)}
        >
          <!-- Header: avatar + name + date -->
          <div class="mb-2 flex items-center gap-2">
            <div class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full
                        bg-amber-400 text-[9px] font-bold text-white">
              {getInitials(comment.userName)}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-semibold text-slate-700">
                {comment.userName ?? 'Anonymous'}
              </p>
            </div>
            <p class="flex-shrink-0 text-[10px] text-slate-400">{formatDate(comment.createdAt)}</p>
          </div>

          <!-- Quote -->
          <blockquote class="mb-2 truncate rounded-lg border-l-2 border-amber-300 bg-amber-50 px-2 py-1
                            text-[11px] italic text-slate-500">
            "{comment.quote}"
          </blockquote>

          <!-- Comment text -->
          <p class="mb-3 text-sm text-slate-700">{comment.text}</p>

          <!-- Actions -->
          <div class="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              disabled={resolving[comment.id]}
              onclick={(e) => { e.stopPropagation(); resolve(comment); }}
              class="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-emerald-600
                     hover:bg-emerald-50 disabled:opacity-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
              {resolving[comment.id] ? '…' : 'Resolve'}
            </button>

            {#if comment.userId === currentUserId}
              <button
                type="button"
                disabled={deleting[comment.id]}
                onclick={(e) => { e.stopPropagation(); deleteComment(comment); }}
                class="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-red-500
                       hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                </svg>
                {deleting[comment.id] ? '…' : 'Delete'}
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
