import { o as onDestroy } from "../../../../chunks/environment.js";
import { B as attr, V as escape_html, a as ensure_array_like, c as store_get, i as derived, l as stringify, n as attr_class, r as attr_style, u as unsubscribe_stores } from "../../../../chunks/dev.js";
import "../../../../chunks/navigation.js";
import { a as pageIcons } from "../../../../chunks/queue.js";
import { Mark, mergeAttributes } from "@tiptap/core";
import "@tiptap/starter-kit";
import "@tiptap/extension-placeholder";
import "@tiptap/extension-collaboration";
import "@tiptap/extension-collaboration-cursor";
import "@tiptap/extension-link";
import "@tiptap/extension-image";
import "@liveblocks/client";
import "@liveblocks/yjs";
import "yjs";
import "y-indexeddb";
Mark.create({
	name: "comment",
	inclusive: false,
	addAttributes() {
		return { commentId: {
			default: null,
			parseHTML: (el) => el.getAttribute("data-comment-id"),
			renderHTML: (attrs) => ({ "data-comment-id": attrs.commentId })
		} };
	},
	parseHTML() {
		return [{ tag: "mark[data-comment-id]" }];
	},
	renderHTML({ HTMLAttributes }) {
		return [
			"mark",
			mergeAttributes(HTMLAttributes, { class: "comment-highlight" }),
			0
		];
	},
	addCommands() {
		return {
			setCommentMark: (commentId) => ({ commands }) => {
				return commands.setMark(this.name, { commentId });
			},
			unsetCommentMark: (commentId) => ({ tr, dispatch, state }) => {
				if (dispatch) {
					state.doc.descendants((node, pos) => {
						const mark = node.marks.find((m) => m.type.name === "comment" && m.attrs.commentId === commentId);
						if (mark) tr.removeMark(pos, pos + node.nodeSize, mark.type);
					});
					dispatch(tr);
				}
				return true;
			}
		};
	}
});
//#endregion
//#region src/lib/components/Editor.svelte
function Editor_1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		let cursorName = "Anonymous";
		let cursorColor = "#7C3AED";
		let others = [];
		let tooltipId = null;
		let toasts = [];
		let comments = [];
		const MAX_AVATARS = 3;
		onDestroy(() => {});
		$$renderer.push(`<div class="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-2"><!--[-->`);
		const each_array = ensure_array_like(toasts);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let toast = each_array[$$index];
			$$renderer.push(`<div class="pointer-events-auto flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg transition-all duration-300 ease-out"${attr_style(`opacity:${stringify(toast.visible ? 1 : 0)};transform:translateY(${stringify(toast.visible ? 0 : 12)}px) scale(${stringify(toast.visible ? 1 : .95)})`)}><div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm"${attr_style(`background:${stringify(toast.color)};`)}>${escape_html(toast.initials)}</div> <div class="min-w-0"><p class="truncate text-sm font-semibold text-slate-800">${escape_html(toast.name)}</p> <p${attr_class(`text-xs ${toast.kind === "join" ? "text-emerald-600" : "text-slate-400"}`)}>${escape_html(toast.kind === "join" ? "● joined this page" : "○ left this page")}</p></div> <button type="button" class="ml-1 flex-shrink-0 rounded-lg p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors" aria-label="Dismiss"><svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"></path></svg></button></div>`);
		}
		$$renderer.push(`<!--]--></div> <div class="rounded-3xl border border-slate-200 bg-white shadow-sm"><div class="flex items-center gap-2 border-b border-slate-100 px-6 py-3"><span class="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"${attr_style(`background:${stringify(cursorColor)}`)}></span> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<span class="text-xs text-slate-500">`);
		if (data?.user) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`Signed in as <strong class="font-semibold text-slate-700">${escape_html(cursorName)}</strong>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`You are <strong class="font-semibold text-slate-700">${escape_html(cursorName)}</strong>`);
		}
		$$renderer.push(`<!--]--></span> `);
		if (!data?.user) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<button type="button" class="rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">Change</button>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		$$renderer.push(`<!--]--> <div class="flex-1"></div> <button type="button" title="Toggle comments"${attr_class(`relative flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors text-slate-500 hover:bg-slate-100`)}><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Comments `);
		if (comments.length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<span class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-white">${escape_html(comments.length)}</span>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></button> `);
		if (others.length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="flex items-center gap-1 border-l border-slate-100 pl-3"><span class="mr-1 text-[10px] text-slate-400">${escape_html(others.length === 1 ? "1 other" : `${others.length} others`)} here</span> <div class="flex items-center -space-x-2"><!--[-->`);
			const each_array_1 = ensure_array_like(others.slice(0, MAX_AVATARS));
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let other = each_array_1[$$index_1];
				$$renderer.push(`<div class="relative flex h-7 w-7 flex-shrink-0 cursor-default items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-sm transition-transform hover:z-10 hover:scale-110"${attr_style(`background:${stringify(other.color)};`)}>${escape_html(other.initials)} `);
				if (tooltipId === other.connectionId) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-2 py-1 text-[10px] font-medium text-white shadow-md">${escape_html(other.name)} <div class="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
			}
			$$renderer.push(`<!--]--> `);
			if (others.length > MAX_AVATARS) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-bold text-slate-600 shadow-sm"${attr("title", others.slice(MAX_AVATARS).map((o) => o.name).join(", "))}>+${escape_html(others.length - MAX_AVATARS)}</div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> <span class="relative ml-1 flex h-2 w-2"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span> <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span></span></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> <div class="flex min-h-[520px]"><div class="relative min-w-0 flex-1 p-6"><div class="prose max-w-none min-h-[480px] outline-none"></div> <input type="file" accept="image/*" class="hidden"/> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region src/lib/components/EmojiPicker.svelte
function EmojiPicker($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { onselect, onclear, current = "" } = $$props;
		let query = "";
		const CATEGORIES = [
			{
				label: "Common",
				emojis: [
					"📝",
					"📋",
					"📊",
					"📈",
					"💡",
					"🔥",
					"⭐",
					"✅",
					"🎯",
					"📌",
					"💬",
					"🗒️",
					"🗓️",
					"📅",
					"🔔",
					"📣"
				]
			},
			{
				label: "Work",
				emojis: [
					"💼",
					"🏢",
					"📞",
					"📧",
					"🤝",
					"⏰",
					"💹",
					"🔗",
					"🔐",
					"🗝️",
					"📤",
					"📥",
					"🗂️",
					"📂",
					"📁",
					"🏆"
				]
			},
			{
				label: "Creative",
				emojis: [
					"🎨",
					"🎭",
					"🎬",
					"🎵",
					"🎸",
					"✏️",
					"🖊️",
					"🖌️",
					"📸",
					"🎪",
					"🎤",
					"🎼",
					"🎹",
					"🎺",
					"🎻",
					"🖼️"
				]
			},
			{
				label: "Tech",
				emojis: [
					"💻",
					"📱",
					"🖥️",
					"⌨️",
					"🖱️",
					"💾",
					"🌐",
					"🔧",
					"🔌",
					"⚡",
					"🚀",
					"🤖",
					"🛸",
					"🧪",
					"🔬",
					"🔭"
				]
			},
			{
				label: "Nature",
				emojis: [
					"🌍",
					"🌱",
					"🌿",
					"🍀",
					"🌸",
					"🌺",
					"🌻",
					"☀️",
					"🌙",
					"🌊",
					"🔮",
					"❄️",
					"🌈",
					"⚡",
					"🦋",
					"🐝"
				]
			},
			{
				label: "People",
				emojis: [
					"👤",
					"👥",
					"🧑‍💻",
					"👩‍🎨",
					"🧑‍🏫",
					"👨‍💼",
					"🧑‍🔬",
					"👩‍🍳",
					"🧑‍🎤",
					"👩‍🚀",
					"🧙",
					"🦸",
					"🧑‍🤝‍🧑",
					"🫂",
					"🤔",
					"💪"
				]
			},
			{
				label: "Objects",
				emojis: [
					"📚",
					"📖",
					"📰",
					"🔑",
					"🧲",
					"💎",
					"👑",
					"🏺",
					"🧩",
					"🎲",
					"🃏",
					"🎮",
					"🏅",
					"🥇",
					"🎁",
					"🛡️"
				]
			},
			{
				label: "Places",
				emojis: [
					"🏠",
					"🏔️",
					"🏕️",
					"🏖️",
					"🏛️",
					"🏗️",
					"🌆",
					"🌃",
					"🗺️",
					"⚓",
					"🏟️",
					"🌋",
					"🗼",
					"🗽",
					"🏰",
					"🕌"
				]
			}
		];
		let allEmojis = derived(() => CATEGORIES.flatMap((c) => c.emojis.map((e) => ({
			emoji: e,
			cat: c.label
		}))));
		let filtered = derived(() => query.trim().length === 0 ? null : allEmojis().filter(({ emoji }) => emoji.includes(query.trim())));
		$$renderer.push(`<div class="w-64 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden"><div class="border-b border-slate-100 px-3 py-2"><input type="search"${attr("value", query)} placeholder="Search emoji…" class="w-full rounded-lg bg-slate-50 px-2 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-400 border border-slate-200"/></div> <div class="max-h-60 overflow-y-auto px-2 py-2 space-y-2">`);
		if (filtered()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="flex flex-wrap gap-0.5"><!--[-->`);
			const each_array = ensure_array_like(filtered());
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let { emoji } = each_array[$$index];
				$$renderer.push(`<button type="button"${attr_class(`h-8 w-8 rounded-lg text-lg leading-none flex items-center justify-center hover:bg-violet-50 transition-colors ${current === emoji ? "bg-violet-100 ring-1 ring-violet-400" : ""}`)}>${escape_html(emoji)}</button>`);
			}
			$$renderer.push(`<!--]--> `);
			if (filtered().length === 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<p class="w-full py-3 text-center text-xs text-slate-400 italic">No results</p>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--[-->`);
			const each_array_1 = ensure_array_like(CATEGORIES);
			for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
				let cat = each_array_1[$$index_2];
				$$renderer.push(`<div><p class="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">${escape_html(cat.label)}</p> <div class="flex flex-wrap gap-0.5"><!--[-->`);
				const each_array_2 = ensure_array_like(cat.emojis);
				for (let $$index_1 = 0, $$length = each_array_2.length; $$index_1 < $$length; $$index_1++) {
					let emoji = each_array_2[$$index_1];
					$$renderer.push(`<button type="button"${attr_class(`h-8 w-8 rounded-lg text-lg leading-none flex items-center justify-center hover:bg-violet-50 transition-colors ${current === emoji ? "bg-violet-100 ring-1 ring-violet-400" : ""}`)}>${escape_html(emoji)}</button>`);
				}
				$$renderer.push(`<!--]--></div></div>`);
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></div> <div class="border-t border-slate-100 px-3 py-1.5 flex items-center justify-between">`);
		if (current && onclear) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<button type="button" class="text-xs text-slate-400 hover:text-red-400 transition-colors">Remove icon</button>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<span></span>`);
		}
		$$renderer.push(`<!--]--> <span class="text-[10px] text-slate-300">Click to select</span></div></div>`);
	});
}
//#endregion
//#region src/routes/page/[id]/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { data } = $$props;
		let ancestors = derived(() => data.ancestors ?? []);
		let pageId = derived(() => data.page?.id ?? "");
		derived(() => data.page?.title ?? "Untitled");
		let titleValue = "";
		let pickerOpen = false;
		function pickEmoji(emoji) {
			pageIcons.setIcon(pageId(), emoji);
			pickerOpen = false;
		}
		function clearEmoji() {
			pageIcons.clearIcon(pageId());
			pickerOpen = false;
		}
		$$renderer.push(`<main class="flex h-full flex-col"><div class="border-b border-slate-100 bg-white px-8 py-3">`);
		if (ancestors().length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<nav class="mb-2 flex items-center gap-1 text-xs text-slate-400" aria-label="Breadcrumb"><a href="/" class="hover:text-slate-600 transition-colors">Home</a> <!--[-->`);
			const each_array = ensure_array_like(ancestors());
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let ancestor = each_array[$$index];
				$$renderer.push(`<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"></path></svg> <a${attr("href", `/page/${stringify(ancestor.id)}`)} class="max-w-[140px] truncate hover:text-slate-600 transition-colors"${attr("title", ancestor.title)}>`);
				if (store_get($$store_subs ??= {}, "$pageIcons", pageIcons)[ancestor.id]) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="mr-0.5">${escape_html(store_get($$store_subs ??= {}, "$pageIcons", pageIcons)[ancestor.id])}</span>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->${escape_html(ancestor.title)}</a>`);
			}
			$$renderer.push(`<!--]--> <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"></path></svg> <span class="max-w-[160px] truncate font-medium text-slate-600"${attr("title", titleValue)}>`);
			if (store_get($$store_subs ??= {}, "$pageIcons", pageIcons)[pageId()]) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="mr-0.5">${escape_html(store_get($$store_subs ??= {}, "$pageIcons", pageIcons)[pageId()])}</span>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->${escape_html(titleValue)}</span></nav>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="group relative flex items-center gap-3"><div class="relative shrink-0"><button type="button"${attr_class(`flex h-10 w-10 items-center justify-center rounded-xl text-2xl hover:bg-slate-100 transition-colors ${pickerOpen ? "bg-slate-100" : ""}`)} title="Change page icon" aria-label="Change page icon">${escape_html(store_get($$store_subs ??= {}, "$pageIcons", pageIcons)[pageId()] ?? "📝")}</button> `);
		if (pickerOpen) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="absolute left-0 top-12 z-50">`);
			EmojiPicker($$renderer, {
				current: store_get($$store_subs ??= {}, "$pageIcons", pageIcons)[pageId()] ?? "",
				onselect: pickEmoji,
				onclear: clearEmoji
			});
			$$renderer.push(`<!----></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> <div class="relative flex flex-1 items-center gap-2 min-w-0">`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<h1 role="button" tabindex="0" class="cursor-text select-none text-2xl font-semibold text-slate-900 leading-tight rounded px-0.5 -mx-0.5 hover:bg-slate-50 transition-colors" title="Click to edit title">${escape_html(titleValue)}</h1>`);
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<span class="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">Click to edit</span>`);
		$$renderer.push(`<!--]--></div></div></div> <div class="flex-1 overflow-auto px-8 py-6">`);
		Editor_1($$renderer, { data });
		$$renderer.push(`<!----></div></main>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
//#endregion
export { _page as default };
