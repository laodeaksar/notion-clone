import { t as getEnv } from "../../chunks/env.js";
//#region src/routes/+layout.server.ts
var load = async ({ locals, cookies, depends, platform }) => {
	depends("app:pages");
	const user = locals.user ?? null;
	const hocuspocusUrl = getEnv(platform, "PUBLIC_HOCUSPOCUS_URL") || "ws://localhost:1234";
	if (!user) return {
		user,
		pages: [],
		hocuspocusUrl
	};
	const token = cookies.get("token");
	if (!token) return {
		user,
		pages: [],
		hocuspocusUrl
	};
	const API_GATEWAY_URL = getEnv(platform, "API_GATEWAY_URL");
	try {
		const res = await fetch(`${API_GATEWAY_URL}/pages`, { headers: { Authorization: `Bearer ${token}` } });
		if (!res.ok) return {
			user,
			pages: [],
			hocuspocusUrl
		};
		const { pages } = await res.json();
		return {
			user,
			hocuspocusUrl,
			pages: pages ?? []
		};
	} catch {
		return {
			user,
			pages: [],
			hocuspocusUrl
		};
	}
};
//#endregion
export { load };
