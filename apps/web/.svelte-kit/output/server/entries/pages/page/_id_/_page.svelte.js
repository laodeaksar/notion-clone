import { o as onDestroy } from "../../../../chunks/environment.js";
import { B as attr, V as escape_html, a as ensure_array_like, c as store_get, i as derived, l as stringify, n as attr_class, r as attr_style, u as unsubscribe_stores } from "../../../../chunks/dev.js";
import "../../../../chunks/navigation.js";
import { a as pageIcons } from "../../../../chunks/queue.js";
import "@tiptap/core";
import "@tiptap/starter-kit";
import "@tiptap/extension-placeholder";
import "@tiptap/extension-collaboration";
import "@tiptap/extension-collaboration-cursor";
import "@tiptap/extension-link";
import "@tiptap/extension-image";
import "@hocuspocus/provider";
import "yjs";
import "y-indexeddb";
//#region src/lib/components/Editor.svelte
function Editor_1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		let cursorName = "Anonymous";
		let cursorColor = "#7C3AED";
		onDestroy(() => {});
		$$renderer.push(`<div class="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div class="mb-4 flex items-center gap-2"><span class="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"${attr_style(`background:${stringify(cursorColor)}`)}></span> `);
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
		$$renderer.push(`<!--]--></div> <div class="prose max-w-none min-h-[480px] outline-none"></div> <input type="file" accept="image/*" class="hidden"/> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
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
