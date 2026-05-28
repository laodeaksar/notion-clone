<script lang="ts">
  import type { Editor } from '@tiptap/core';

  type Props = {
    editor:   Editor | null;
    pageId:   string;
    userName: string;
    onCreated: (commentId: string) => void;
  };

  let { editor, pageId, userName, onCreated }: Props = $props();

  let visible    = $state(false);
  let expanded   = $state(false);
  let text       = $state('');
  let submitting = $state(false);
  let pos        = $state({ top: 0, left: 0 });

  let inputEl: HTMLTextAreaElement | null = null;

  function getSelectionPos(from: number, to: number) {
    if (!editor) return null;
    const start = editor.view.coordsAtPos(from);
    const end   = editor.view.coordsAtPos(to);
    const editorRect = editor.view.dom.getBoundingClientRect();
    return {
      top:  start.top  - editorRect.top - 44,
      left: Math.max(0, (start.left + end.left) / 2 - editorRect.left - 60)
    };
  }

  $effect(() => {
    if (!editor) return;
    const update = () => {
      const { from, to, empty } = editor!.state.selection;
      if (empty || from === to) {
        visible  = false;
        expanded = false;
        text     = '';
        return;
      }
      const hasCommentMark = editor!.isActive('comment');
      if (hasCommentMark) { visible = false; return; }

      const p = getSelectionPos(from, to);
      if (!p) return;
      pos     = p;
      visible = true;
    };
    editor.on('selectionUpdate', update);
    editor.on('blur', () => {
      setTimeout(() => {
        if (!document.activeElement?.closest('[data-comment-popover]')) {
          visible  = false;
          expanded = false;
        }
      }, 150);
    });
    return () => { editor?.off('selectionUpdate', update); };
  });

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!editor || !text.trim() || submitting) return;

    const { from, to } = editor.state.selection;
    const quote = editor.state.doc.textBetween(from, to, ' ');
    if (!quote.trim()) return;

    submitting = true;
    try {
      const res = await fetch('/api/comments', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ pageId, quote, text: text.trim(), userName })
      });
      if (!res.ok) throw new Error('Failed to save comment');
      const { comment } = await res.json();

      editor.chain().focus().setCommentMark(comment.id).run();
      onCreated(comment.id);

      text       = '';
      expanded   = false;
      visible    = false;
    } catch (err) {
      console.error('[CommentPopover] submit error:', err);
    } finally {
      submitting = false;
    }
  }

  function openInput() {
    expanded = true;
    setTimeout(() => inputEl?.focus(), 50);
  }

  function cancel() {
    expanded = false;
    text     = '';
  }
</script>

{#if visible}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    data-comment-popover
    class="absolute z-30"
    style="top: {pos.top}px; left: {pos.left}px;"
    onmousedown={(e) => e.preventDefault()}
  >
    {#if !expanded}
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-semibold text-white shadow-md
               hover:bg-amber-500 active:scale-95 transition-all"
        onclick={openInput}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Comment
      </button>
    {:else}
      <form
        onsubmit={submit}
        class="w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"
      >
        <textarea
          bind:this={inputEl}
          bind:value={text}
          placeholder="Add a comment…"
          rows={3}
          class="w-full resize-none rounded-lg border border-slate-200 p-2 text-sm text-slate-700
                 placeholder-slate-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-300"
        ></textarea>
        <div class="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onclick={cancel}
            class="rounded-lg px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 transition-colors"
          >Cancel</button>
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            class="rounded-lg bg-amber-400 px-3 py-1 text-xs font-semibold text-white
                   hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >{submitting ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    {/if}
  </div>
{/if}
