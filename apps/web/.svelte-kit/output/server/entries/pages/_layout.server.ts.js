import { t as getEnv } from "../../chunks/env.js";
//#region src/routes/+layout.server.ts
var load = async ({ locals, cookies, depends, platform }) => {
	depends("app:pages");
	const user = locals.user ?? null;
	if (!user) return {
		user,
		pages: [],
		sessionToken: null
	};
	const token = locals.sessionToken ?? cookies.get("better-auth.session_token");
	if (!token) return {
		user,
		pages: [],
		sessionToken: null
	};
	const API_GATEWAY_URL = getEnv(platform, "API_GATEWAY_URL");
	try {
		const res = await fetch(`${API_GATEWAY_URL}/pages`, { headers: { Authorization: `Bearer ${token}` } });
		if (!res.ok) return {
			user,
			pages: [],
			sessionToken: token
		};
		const { pages } = await res.json();
		return {
			user,
			sessionToken: token,
			pages: pages ?? []
		};
	} catch {
		return {
			user,
			pages: [],
			sessionToken: token
		};
	}
};
//#endregion
export { load };
