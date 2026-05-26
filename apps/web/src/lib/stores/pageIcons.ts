import { writable } from 'svelte/store';

const STORAGE_KEY = 'notion-page-icons-v1';

function load(): Record<string, string> {
  if (typeof localStorage === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); }
  catch { return {}; }
}

function persist(icons: Record<string, string>) {
  if (typeof localStorage !== 'undefined')
    localStorage.setItem(STORAGE_KEY, JSON.stringify(icons));
}

function createStore() {
  const { subscribe, update, set } = writable<Record<string, string>>({});

  // hydrate on first browser access
  if (typeof window !== 'undefined') set(load());

  return {
    subscribe,
    setIcon(pageId: string, emoji: string) {
      update(prev => {
        const next = { ...prev, [pageId]: emoji };
        persist(next);
        return next;
      });
    },
    clearIcon(pageId: string) {
      update(prev => {
        const next = { ...prev };
        delete next[pageId];
        persist(next);
        return next;
      });
    }
  };
}

export const pageIcons = createStore();
