import { B as attr, V as escape_html, n as attr_class, o as head } from "../../../chunks/dev.js";
import "../../../chunks/client.js";
import "../../../chunks/navigation.js";
//#region src/routes/auth/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { form } = $$props;
		let loading = false;
		head("1s728sz", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>${escape_html("Sign in")} — Notion Clone</title>`);
			});
		});
		$$renderer.push(`<div class="flex min-h-screen items-center justify-center bg-slate-50 px-4"><div class="w-full max-w-sm"><div class="mb-8 text-center"><div class="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white text-2xl shadow-lg">📝</div> <h1 class="text-2xl font-bold text-slate-900">Notion Clone</h1> <p class="mt-1 text-sm text-slate-500">A collaborative workspace</p></div> <div class="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><div class="mb-6 flex rounded-xl bg-slate-100 p-1"><button type="button"${attr_class(`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors bg-white text-slate-800 shadow-sm`)}>Sign in</button> <button type="button"${attr_class(`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors text-slate-500 hover:text-slate-700`)}>Create account</button></div> `);
		if (form?.error) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">${escape_html(form.error)}</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<form method="POST" action="?/login" class="space-y-4"><div><label for="login-email" class="mb-1.5 block text-xs font-medium text-slate-700">Email</label> <input id="login-email" name="email" type="email" required="" autocomplete="email"${attr("value", form?.email ?? "")} placeholder="you@example.com" class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 transition"/></div> <div><label for="login-password" class="mb-1.5 block text-xs font-medium text-slate-700">Password</label> <input id="login-password" name="password" type="password" required="" autocomplete="current-password" placeholder="••••••••" class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 transition"/></div> <button type="submit"${attr("disabled", loading, true)} class="mt-1 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">${escape_html("Sign in")}</button></form>`);
		$$renderer.push(`<!--]--></div></div></div>`);
	});
}
//#endregion
export { _page as default };
