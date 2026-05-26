import { B as attr, V as escape_html, a as ensure_array_like, i as derived, l as stringify, n as attr_class, o as head, r as attr_style } from "../../../chunks/dev.js";
import { n as isImageUrl, t as formatBytes } from "../../../chunks/utils2.js";
//#region src/lib/components/FileUpload.svelte
function FileUpload($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { maxFiles = 20, accept = "*/*", folder = "notion-clone", onuploaded } = $$props;
		let items = [];
		let copiedId = null;
		let successItems = derived(() => items.filter((i) => i.status === "success"));
		let pendingItems = derived(() => items.filter((i) => i.status !== "success"));
		function fileIcon(file) {
			const t = file.type;
			if (t.startsWith("image/")) return "🖼️";
			if (t.startsWith("video/")) return "🎬";
			if (t.startsWith("audio/")) return "🎵";
			if (t === "application/pdf") return "📄";
			if (t.includes("zip") || t.includes("compressed")) return "🗜️";
			if (t.includes("word") || t.includes("document")) return "📝";
			if (t.includes("sheet") || t.includes("excel")) return "📊";
			return "📁";
		}
		$$renderer.push(`<div class="space-y-4"><button type="button"${attr_class(`relative w-full rounded-2xl border-2 border-dashed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/30`)}><div class="flex flex-col items-center justify-center gap-3 py-12 px-6"><div${attr_class(`text-4xl  transition-transform duration-200`)}>${escape_html("☁️")}</div> <div class="text-center"><p class="font-medium text-slate-700">${escape_html("Drag & drop files here")}</p> <p class="mt-1 text-sm text-slate-500">or <span class="text-violet-600 font-medium">click to browse</span> — up to ${escape_html(maxFiles)} files</p></div></div> <input type="file"${attr("accept", accept)} multiple="" class="sr-only"/></button> `);
		if (pendingItems().length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="space-y-2"><p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Uploading</p> <!--[-->`);
			const each_array = ensure_array_like(pendingItems());
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let item = each_array[$$index];
				$$renderer.push(`<div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><div class="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">`);
				if (item.preview) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<img${attr("src", item.preview)}${attr("alt", item.file.name)} class="h-full w-full object-cover"/>`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<div class="flex h-full w-full items-center justify-center text-xl">${escape_html(fileIcon(item.file))}</div>`);
				}
				$$renderer.push(`<!--]--></div> <div class="min-w-0 flex-1"><p class="truncate text-sm font-medium text-slate-700">${escape_html(item.file.name)}</p> <p class="text-xs text-slate-400">${escape_html(formatBytes(item.file.size))}</p> `);
				if (item.status === "uploading") {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full bg-violet-500 transition-all duration-300"${attr_style(`width: ${stringify(item.progress)}%`)}></div></div>`);
				} else if (item.status === "error") {
					$$renderer.push("<!--[1-->");
					$$renderer.push(`<p class="mt-0.5 text-xs text-red-500">${escape_html(item.error)}</p>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div> <div class="flex items-center gap-1">`);
				if (item.status === "uploading") {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="text-xs text-violet-500 font-medium">${escape_html(Math.round(item.progress))}%</span>`);
				} else if (item.status === "error") {
					$$renderer.push("<!--[1-->");
					$$renderer.push(`<button type="button" class="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Retry</button>`);
				} else if (item.status === "pending") {
					$$renderer.push("<!--[2-->");
					$$renderer.push(`<span class="text-xs text-slate-400">Queued</span>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <button type="button" class="ml-1 rounded-lg p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500" aria-label="Remove">✕</button></div></div>`);
			}
			$$renderer.push(`<!--]--></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (successItems().length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="space-y-2"><p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Uploaded (${escape_html(successItems().length)})</p> <div class="grid grid-cols-1 gap-2 sm:grid-cols-2"><!--[-->`);
			const each_array_1 = ensure_array_like(successItems());
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let item = each_array_1[$$index_1];
				$$renderer.push(`<div class="group relative flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><div class="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">`);
				if (item.preview) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<img${attr("src", item.preview)}${attr("alt", item.file.name)} class="h-full w-full object-cover"/>`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<div class="flex h-full w-full items-center justify-center text-xl">${escape_html(fileIcon(item.file))}</div>`);
				}
				$$renderer.push(`<!--]--></div> <div class="min-w-0 flex-1"><p class="truncate text-sm font-medium text-slate-700">${escape_html(item.file.name)}</p> <p class="text-xs text-slate-400">${escape_html(formatBytes(item.file.size))}</p></div> <div class="flex items-center gap-1"><span class="text-green-500 text-sm">✓</span> `);
				if (item.url) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<button type="button" class="rounded-lg px-2 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 transition-colors">${escape_html(copiedId === item.id ? "✓ Copied" : "Copy URL")}</button> <a${attr("href", item.url)} target="_blank" rel="noopener noreferrer" class="rounded-lg p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500 text-sm" aria-label="Open file">↗</a>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <button type="button" class="rounded-lg p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500" aria-label="Remove">✕</button></div></div>`);
			}
			$$renderer.push(`<!--]--></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/routes/files/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		let gallery = data.files ?? [];
		let truncated = data.truncated ?? false;
		data.cursor;
		let loadError = data.error ?? null;
		let newUploads = [];
		let copiedId = null;
		let deletingId = null;
		let confirmId = null;
		let loadingMore = false;
		let allFiles = derived(() => [...newUploads, ...gallery]);
		let total = derived(() => allFiles().length);
		function onUploaded(detail) {
			const { url, publicId, name } = detail;
			newUploads = [{
				publicId,
				url,
				name,
				size: 0,
				uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
				isNew: true
			}, ...newUploads];
			gallery = gallery.filter((f) => f.publicId !== publicId);
		}
		head("5hf2uo", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Files — Notion Clone</title>`);
			});
		});
		$$renderer.push(`<div class="min-h-screen bg-slate-50"><header class="border-b border-slate-200 bg-white"><div class="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4"><a href="/" class="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">← Home</a> <div class="h-4 w-px bg-slate-200"></div> <h1 class="text-lg font-semibold text-slate-800">File Manager</h1> <span class="ml-auto rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">Cloudinary</span></div></header> <main class="mx-auto max-w-4xl px-6 py-8 space-y-8"><section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 class="mb-1 text-base font-semibold text-slate-800">Upload Files</h2> <p class="mb-5 text-sm text-slate-500">Drag &amp; drop or click to select — files are stored on Cloudinary and the URL is saved to your database.</p> `);
		FileUpload($$renderer, {
			folder: "notion-clone",
			onuploaded: onUploaded
		});
		$$renderer.push(`<!----></section> `);
		if (loadError) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800"><span class="text-lg">⚠️</span> <div><strong class="font-semibold">Could not load existing files:</strong> ${escape_html(loadError)} — files uploaded this session will still appear below.</div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (total() > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div class="mb-4 flex items-center justify-between"><h2 class="text-base font-semibold text-slate-800">All Files <span class="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">${escape_html(total())}${escape_html(truncated ? "+" : "")}</span></h2> `);
			if (newUploads.length > 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">${escape_html(newUploads.length)} new</span>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"><!--[-->`);
			const each_array = ensure_array_like(allFiles());
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let file = each_array[$$index];
				const isDeleting = deletingId === file.publicId;
				const isConfirming = confirmId === file.publicId;
				const isNew = newUploads.some((n) => n.publicId === file.publicId);
				$$renderer.push(`<div${attr_class(`group relative overflow-hidden rounded-xl border bg-slate-50 transition-shadow hover:shadow-md ${isNew ? "border-violet-300 ring-1 ring-violet-200" : "border-slate-200"} ${isDeleting ? "opacity-50 pointer-events-none" : ""}`)}><div class="aspect-square w-full overflow-hidden bg-slate-100">`);
				if (isImageUrl(file.url)) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<img${attr("src", file.url)}${attr("alt", file.name)}${attr_class(`h-full w-full object-cover transition-transform duration-200 group-hover:scale-105 ${isDeleting ? "blur-sm" : ""}`)} loading="lazy"/>`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<div class="flex h-full w-full items-center justify-center text-4xl">📁</div>`);
				}
				$$renderer.push(`<!--]--></div> <div class="px-2 py-1.5"><p class="truncate text-xs font-medium text-slate-700"${attr("title", file.name)}>${escape_html(file.name)}</p> `);
				if (file.size > 0) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<p class="text-[10px] text-slate-400">${escape_html(formatBytes(file.size))}</p>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div> `);
				if (isNew) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="absolute left-1.5 top-1.5 rounded-full bg-violet-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">New</span>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (isDeleting) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="absolute inset-0 flex items-center justify-center bg-white/80"><div class="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-red-500"></div></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (isConfirming) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 p-3"><p class="text-center text-xs font-semibold text-white leading-tight">Delete from Cloudinary?</p> <div class="flex gap-2"><button type="button" class="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-red-600 transition-colors">Delete</button> <button type="button" class="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow hover:bg-white transition-colors">Cancel</button></div></div>`);
				} else if (!isDeleting) {
					$$renderer.push("<!--[1-->");
					$$renderer.push(`<div class="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity duration-150 group-hover:opacity-100 p-2"><button type="button" class="w-full rounded-lg bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 shadow hover:bg-violet-50 transition-colors">${escape_html(copiedId === file.publicId ? "✓ Copied!" : "Copy URL")}</button> <a${attr("href", file.url)} target="_blank" rel="noopener noreferrer" class="w-full rounded-lg bg-white/90 px-2 py-1.5 text-center text-xs font-semibold text-slate-700 shadow hover:bg-violet-50 transition-colors">Open ↗</a> <button type="button" class="w-full rounded-lg bg-red-500/90 px-2 py-1.5 text-xs font-semibold text-white shadow hover:bg-red-600 transition-colors">🗑 Delete</button></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
			}
			$$renderer.push(`<!--]--></div> `);
			if (truncated) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="mt-6 flex flex-col items-center gap-2">`);
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <button type="button"${attr("disabled", loadingMore, true)} class="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">`);
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`Load more`);
				$$renderer.push(`<!--]--></button></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></section>`);
		} else if (!loadError) {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div class="flex flex-col items-center gap-3 py-8 text-center text-slate-400"><span class="text-5xl">🗂️</span> <p class="text-sm">No files yet — upload something above and it will appear here.</p></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></main></div>`);
	});
}
//#endregion
export { _page as default };
