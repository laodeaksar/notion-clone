import { readable, writable } from 'svelte/store';

/** Reactive store that reflects navigator.onLine in real time */
export const online = readable(
  typeof navigator !== 'undefined' ? navigator.onLine : true,
  (set) => {
    if (typeof window === 'undefined') return;
    const handleOnline  = () => set(true);
    const handleOffline = () => set(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
);

/** Number of mutations currently waiting to be synced */
export const pendingCount = writable(0);

/** Whether a sync is in progress */
export const syncing = writable(false);
