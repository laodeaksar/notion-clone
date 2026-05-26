import { D as readable, O as writable } from "./dev.js";
import "./exports.js";
//#region src/lib/stores/pageIcons.ts
var STORAGE_KEY = "notion-page-icons-v1";
function load$1() {
	if (typeof localStorage === "undefined") return {};
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
	} catch {
		return {};
	}
}
function persist(icons) {
	if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(icons));
}
function createStore() {
	const { subscribe, update, set } = writable({});
	if (typeof window !== "undefined") set(load$1());
	return {
		subscribe,
		setIcon(pageId, emoji) {
			update((prev) => {
				const next = {
					...prev,
					[pageId]: emoji
				};
				persist(next);
				return next;
			});
		},
		clearIcon(pageId) {
			update((prev) => {
				const next = { ...prev };
				delete next[pageId];
				persist(next);
				return next;
			});
		}
	};
}
var pageIcons = createStore();
//#endregion
//#region src/lib/stores/network.ts
/** Reactive store that reflects navigator.onLine in real time */
var online = readable(typeof navigator !== "undefined" ? navigator.onLine : true, (set) => {
	if (typeof window === "undefined") return;
	const handleOnline = () => set(true);
	const handleOffline = () => set(false);
	window.addEventListener("online", handleOnline);
	window.addEventListener("offline", handleOffline);
	return () => {
		window.removeEventListener("online", handleOnline);
		window.removeEventListener("offline", handleOffline);
	};
});
/** Number of mutations currently waiting to be synced */
var pendingCount = writable(0);
/** Whether a sync is in progress */
var syncing = writable(false);
//#endregion
//#region src/lib/offline/queue.ts
var QUEUE_KEY = "notion:pending-mutations";
function load() {
	if (typeof localStorage === "undefined") return [];
	try {
		return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
	} catch {
		return [];
	}
}
/** Initialise the store counter from persisted queue (call on mount) */
function initQueue() {
	if (typeof localStorage !== "undefined") pendingCount.set(load().length);
}
//#endregion
export { pageIcons as a, syncing as i, online as n, pendingCount as r, initQueue as t };
