import "../../chunks/environment.js";
import { B as attr, V as escape_html, a as ensure_array_like, c as store_get, et as getContext, i as derived, l as stringify, n as attr_class, r as attr_style, u as unsubscribe_stores } from "../../chunks/dev.js";
import "../../chunks/client.js";
import "../../chunks/navigation.js";
import { a as pageIcons, i as syncing, n as online, r as pendingCount } from "../../chunks/queue.js";
//#region ../../node_modules/.pnpm/@sveltejs+kit@2.61.1_@sveltejs+vite-plugin-svelte@7.1.2_svelte@5.55.9_@typescript-eslin_edfb0534f791470f14b42776b3125d2e/node_modules/@sveltejs/kit/src/runtime/app/stores.js
/**
* A function that returns all of the contextual stores. On the server, this must be called during component initialization.
* Only use this if you need to defer store subscription until after the component has mounted, for some reason.
*
* @deprecated Use `$app/state` instead (requires Svelte 5, [see docs for more info](https://svelte.dev/docs/kit/migrating-to-sveltekit-2#SvelteKit-2.12:-$app-stores-deprecated))
*/
var getStores = () => {
	const stores$1 = getContext("__svelte__");
	return {
		/** @type {typeof page} */
		page: { subscribe: stores$1.page.subscribe },
		/** @type {typeof navigating} */
		navigating: { subscribe: stores$1.navigating.subscribe },
		/** @type {typeof updated} */
		updated: stores$1.updated
	};
};
/**
* A readable store whose value contains page data.
*
* On the server, this store can only be subscribed to during component initialization. In the browser, it can be subscribed to at any time.
*
* @deprecated Use `page` from `$app/state` instead (requires Svelte 5, [see docs for more info](https://svelte.dev/docs/kit/migrating-to-sveltekit-2#SvelteKit-2.12:-$app-stores-deprecated))
* @type {import('svelte/store').Readable<import('@sveltejs/kit').Page>}
*/
var page = { subscribe(fn) {
	return getStores().page.subscribe(fn);
} };
//#endregion
//#region src/lib/components/Sidebar.svelte
function Sidebar($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { initialPages } = $$props;
		let pages = [...initialPages];
		let tree = derived(() => buildTree(pages));
		function buildTree(flat) {
			const childMap = /* @__PURE__ */ new Map();
			for (const p of flat) {
				const key = p.parentId ?? null;
				if (!childMap.has(key)) childMap.set(key, []);
				childMap.get(key).push({
					...p,
					children: []
				});
			}
			function attach(parentId) {
				return (childMap.get(parentId) ?? []).map((node) => ({
					...node,
					children: attach(node.id)
				}));
			}
			return attach(null);
		}
		let expandedIds = /* @__PURE__ */ new Set();
		let creatingParentId = -1;
		let newTitle = "";
		let renamingId = null;
		let renameVal = "";
		let confirmId = null;
		let busy = false;
		let currentId = derived(() => store_get($$store_subs ??= {}, "$page", page).params.id ?? null);
		function allDescendantIds(id) {
			return pages.filter((p) => p.parentId === id).flatMap((c) => [c.id, ...allDescendantIds(c.id)]);
		}
		function treeNodes($$renderer, nodes, depth) {
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(nodes);
			for (let $$index_2 = 0, $$length = each_array.length; $$index_2 < $$length; $$index_2++) {
				let node = each_array[$$index_2];
				const isActive = node.id === currentId();
				const isExpanded = expandedIds.has(node.id);
				const hasKids = node.children.length > 0;
				const isRenaming = renamingId === node.id;
				const isConfirm = confirmId === node.id;
				$$renderer.push(`<div${attr_style(`padding-left: ${stringify(depth * 12)}px`)}><div${attr_class(`group relative flex items-center gap-1 px-2 py-0.5 mx-1 rounded-lg transition-colors ${isActive ? "bg-violet-50 text-violet-700" : "text-slate-700 hover:bg-slate-100"}`)}><button type="button"${attr_class(`shrink-0 rounded p-0.5 text-slate-300 transition-colors ${hasKids ? "hover:bg-slate-200 hover:text-slate-500" : "cursor-default opacity-0 pointer-events-none"}`)}${attr("aria-label", isExpanded ? "Collapse" : "Expand")}${attr("tabindex", hasKids ? 0 : -1)}><svg xmlns="http://www.w3.org/2000/svg"${attr_class(`h-3 w-3 transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`)} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"></path></svg></button> `);
				if (isRenaming) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<form class="flex-1 flex items-center gap-1"><input type="text"${attr("value", renameVal)} autofocus=""${attr("maxlength", 80)} class="min-w-0 flex-1 rounded border border-violet-300 px-1.5 py-0.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-400"/> <button type="submit" class="shrink-0 rounded bg-violet-600 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-violet-700">OK</button></form>`);
				} else if (isConfirm) {
					$$renderer.push("<!--[1-->");
					const descCount = allDescendantIds(node.id).length;
					$$renderer.push(`<span class="flex-1 truncate text-xs text-red-600 font-medium">Delete${escape_html(descCount > 0 ? ` + ${descCount} sub-page${descCount > 1 ? "s" : ""}` : "")}?</span> <button type="button" class="shrink-0 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-red-600">Yes</button> <button type="button" class="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-slate-500 hover:bg-slate-200">No</button>`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<span class="shrink-0 text-base leading-none select-none">${escape_html(store_get($$store_subs ??= {}, "$pageIcons", pageIcons)[node.id] ?? "📄")}</span> <a${attr("href", `/page/${stringify(node.id)}`)} class="min-w-0 flex-1 truncate text-sm leading-6"${attr("title", node.title)}>${escape_html(node.title)}</a> <div class="hidden items-center gap-0.5 group-hover:flex"><button type="button" class="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-violet-600 transition-colors" aria-label="Add sub-page" title="Add sub-page"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button> <button type="button" class="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors" aria-label="Rename" title="Rename"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button> <button type="button" class="rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" aria-label="Delete" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg></button></div>`);
				}
				$$renderer.push(`<!--]--></div> `);
				if (isExpanded && hasKids) {
					$$renderer.push("<!--[0-->");
					treeNodes($$renderer, node.children, depth + 1);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (creatingParentId === node.id) {
					$$renderer.push("<!--[0-->");
					newPageForm($$renderer, node.id, depth + 1);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
			}
			$$renderer.push(`<!--]-->`);
		}
		function newPageForm($$renderer, parentId, depth) {
			$$renderer.push(`<div${attr_style(`padding-left: ${stringify(depth * 12)}px`)}><form class="mx-1 mt-0.5 flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1"><span class="text-xs text-slate-400">📄</span> <input type="text"${attr("value", newTitle)} autofocus="" placeholder="Page title…"${attr("maxlength", 80)} class="min-w-0 flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"/> <button type="submit" class="shrink-0 rounded bg-violet-600 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-violet-700">Add</button></form></div>`);
		}
		$$renderer.push(`<aside${attr_class(`flex flex-col border-r border-slate-200 bg-white transition-all duration-200 w-60 shrink-0`)}><div class="flex items-center gap-1 px-3 py-3 border-b border-slate-100 min-w-0">`);
		$$renderer.push("<!--[0-->");
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<span class="flex-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Pages</span> <button type="button" class="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Search" aria-label="Search pages and blocks"><svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></button>`);
		$$renderer.push(`<!--]-->`);
		$$renderer.push(`<!--]--> <button type="button"${attr_class(`shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors `)}${attr("aria-label", "Collapse sidebar")}${attr("title", "Collapse sidebar")}>`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"></path></svg>`);
		$$renderer.push(`<!--]--></button></div> `);
		$$renderer.push("<!--[0-->");
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<nav class="flex-1 overflow-y-auto py-1.5">`);
		if (tree().length === 0 && true) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<p class="px-4 py-3 text-xs text-slate-400 italic">No pages yet.</p>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		treeNodes($$renderer, tree(), 0);
		$$renderer.push(`<!----> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></nav> <div class="border-t border-slate-100 p-2"><button type="button"${attr("disabled", busy, true)} class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors disabled:opacity-50"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> New page</button></div>`);
		$$renderer.push(`<!--]-->`);
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></aside>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
//#endregion
//#region src/lib/components/OfflineBanner.svelte
function OfflineBanner($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		if (!store_get($$store_subs ??= {}, "$online", online)) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="flex items-center justify-center gap-2 bg-slate-800 px-4 py-2 text-xs font-medium text-white" role="status" aria-live="polite"><span class="inline-block h-1.5 w-1.5 rounded-full bg-amber-400"></span> You're offline — changes will sync when you reconnect `);
			if (store_get($$store_subs ??= {}, "$pendingCount", pendingCount) > 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="rounded-full bg-slate-700 px-1.5 py-0.5 text-[10px] tabular-nums">${escape_html(store_get($$store_subs ??= {}, "$pendingCount", pendingCount))} pending</span>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		} else if (store_get($$store_subs ??= {}, "$syncing", syncing)) {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div class="flex items-center justify-center gap-2 bg-violet-600 px-4 py-2 text-xs font-medium text-white" role="status" aria-live="polite"><svg class="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"></path></svg> Syncing changes…</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
//#endregion
//#region src/routes/+layout.svelte
function _layout($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data, children } = $$props;
		let user = derived(() => data.user ?? null);
		let pages = derived(() => data.pages ?? []);
		$$renderer.push(`<div class="flex h-screen flex-col overflow-hidden bg-slate-50">`);
		OfflineBanner($$renderer, {});
		$$renderer.push(`<!----> `);
		if (user()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<nav class="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-2.5"><a href="/" class="text-sm font-semibold text-slate-800 hover:text-violet-600 transition-colors">Notion Clone</a> <div class="flex items-center gap-3"><span class="text-sm text-slate-600">${escape_html(user().name ?? user().email)}</span> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <button type="button" class="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors">Sign out</button></div></nav> <div class="flex flex-1 overflow-hidden">`);
			Sidebar($$renderer, { initialPages: pages() });
			$$renderer.push(`<!----> <div class="flex-1 overflow-auto">`);
			children($$renderer);
			$$renderer.push(`<!----></div></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			children($$renderer);
			$$renderer.push(`<!---->`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
export { _layout as default };
