import { Mark, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      setCommentMark:   (commentId: string) => ReturnType;
      unsetCommentMark: (commentId: string) => ReturnType;
    };
  }
}

export const CommentMark = Mark.create({
  name: 'comment',

  inclusive: false,

  addAttributes() {
    return {
      commentId: {
        default:     null,
        parseHTML:   (el) => el.getAttribute('data-comment-id'),
        renderHTML:  (attrs) => ({ 'data-comment-id': attrs.commentId })
      }
    };
  },

  parseHTML() {
    return [{ tag: 'mark[data-comment-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'mark',
      mergeAttributes(HTMLAttributes, { class: 'comment-highlight' }),
      0
    ];
  },

  addCommands() {
    return {
      setCommentMark: (commentId: string) => ({ commands }) => {
        return commands.setMark(this.name, { commentId });
      },
      unsetCommentMark: (commentId: string) => ({ tr, dispatch, state }) => {
        if (dispatch) {
          state.doc.descendants((node, pos) => {
            const mark = node.marks.find(
              (m) => m.type.name === 'comment' && m.attrs.commentId === commentId
            );
            if (mark) {
              tr.removeMark(pos, pos + node.nodeSize, mark.type);
            }
          });
          dispatch(tr);
        }
        return true;
      }
    };
  }
});
