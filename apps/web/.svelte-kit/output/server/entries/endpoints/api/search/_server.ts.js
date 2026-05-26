import { t as getEnv } from "../../../../chunks/env.js";
//#region src/routes/api/search/+server.ts
async function GET(event) {
	const token = event.cookies.get("token");
	if (!token) return new Response(JSON.stringify({
		query: "",
		results: []
	}), {
		status: 200,
		headers: { "content-type": "application/json" }
	});
	const API_GATEWAY_URL = getEnv(event.platform, "API_GATEWAY_URL");
	const q = event.url.searchParams.get("q") ?? "";
	const res = await fetch(`${API_GATEWAY_URL}/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } });
	const body = await res.text();
	return new Response(body, {
		status: res.status,
		headers: { "content-type": "application/json" }
	});
}
//#endregion
export { GET };
