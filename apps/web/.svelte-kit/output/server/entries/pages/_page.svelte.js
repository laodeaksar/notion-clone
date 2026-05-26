import { V as escape_html, a as ensure_array_like, i as derived } from "../../chunks/dev.js";
//#region src/routes/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		let user = derived(() => data.user ?? null);
		let pages = derived(() => data.pages ?? []);
		if (user()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="flex h-full flex-col items-center justify-center gap-6 p-10 text-center"><div class="text-6xl select-none">📝</div> <div class="space-y-1"><h2 class="text-xl font-semibold text-slate-800">${escape_html(pages().length === 0 ? "No pages yet" : "Select a page")}</h2> <p class="text-sm text-slate-500">${escape_html(pages().length === 0 ? "Click \"New page\" in the sidebar to get started." : "Choose a page from the sidebar or create a new one.")}</p></div> `);
			if (pages().length === 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="flex flex-wrap justify-center gap-3 pt-2"><a href="/files" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">☁️ File Manager</a></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="flex min-h-screen flex-col items-center justify-center gap-10 bg-slate-50 px-6 py-16 text-center"><div class="space-y-4 max-w-lg"><div class="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-600 text-4xl shadow-lg">📝</div> <h1 class="text-4xl font-bold text-slate-900 tracking-tight">Notion Clone</h1> <p class="text-lg text-slate-500 leading-relaxed">A collaborative workspace — write, organise, and share your ideas in real time.</p> <div class="flex flex-wrap justify-center gap-3 pt-2"><a href="/auth" class="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-violet-700 transition-colors">Get started</a> <a href="/auth" class="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">Sign in</a></div></div> <div class="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3"><!--[-->`);
			const each_array = ensure_array_like([
				{
					icon: "⚡",
					title: "Real-time",
					desc: "Collaborate live with multiple users on the same page."
				},
				{
					icon: "📁",
					title: "File Manager",
					desc: "Upload and manage images and files via Cloudinary."
				},
				{
					icon: "🔍",
					title: "Full-text Search",
					desc: "Search across all your pages and blocks instantly."
				}
			]);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let feat = each_array[$$index];
				$$renderer.push(`<div class="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm"><div class="mb-2 text-2xl">${escape_html(feat.icon)}</div> <h3 class="text-sm font-semibold text-slate-800">${escape_html(feat.title)}</h3> <p class="mt-1 text-xs text-slate-500 leading-relaxed">${escape_html(feat.desc)}</p></div>`);
			}
			$$renderer.push(`<!--]--></div></div>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { _page as default };
