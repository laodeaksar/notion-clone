import { t as getEnv } from "../../../../../chunks/env.js";
//#region src/routes/api/auth/logout/+server.ts
async function POST({ cookies, fetch, platform }) {
	const token = cookies.get("token");
	const API_GATEWAY_URL = getEnv(platform, "API_GATEWAY_URL");
	if (token) await fetch(`${API_GATEWAY_URL}/auth/logout`, {
		method: "POST",
		headers: { Authorization: `Bearer ${token}` }
	}).catch(() => {});
	cookies.delete("token", { path: "/" });
	return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
}
//#endregion
export { POST };
