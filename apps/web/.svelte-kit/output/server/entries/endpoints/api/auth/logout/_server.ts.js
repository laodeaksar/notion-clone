import { t as getEnv } from "../../../../../chunks/env.js";
//#region src/routes/api/auth/logout/+server.ts
async function POST({ cookies, fetch, platform }) {
	const sessionToken = cookies.get("better-auth.session_token");
	const API_GATEWAY_URL = getEnv(platform, "API_GATEWAY_URL");
	if (sessionToken) await fetch(`${API_GATEWAY_URL}/auth/sign-out`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${sessionToken}`,
			"Content-Type": "application/json"
		},
		body: "{}"
	}).catch(() => {});
	cookies.delete("better-auth.session_token", { path: "/" });
	return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
}
//#endregion
export { POST };
