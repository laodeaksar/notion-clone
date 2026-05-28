import { t as getEnv } from "../../../../chunks/env.js";
import { t as signServerJWT } from "../../../../chunks/jwt.js";
//#region src/routes/api/pages/+server.ts
function getToken(event) {
	const userToken = event.cookies.get("better-auth.session_token");
	if (userToken) return Promise.resolve(userToken);
	return signServerJWT(getEnv(event.platform, "JWT_SECRET"));
}
async function GET(event) {
	const token = await getToken(event);
	const API_GATEWAY_URL = getEnv(event.platform, "API_GATEWAY_URL");
	const res = await fetch(`${API_GATEWAY_URL}/pages`, { headers: { Authorization: `Bearer ${token}` } });
	const body = await res.text();
	return new Response(body, {
		status: res.status,
		headers: { "content-type": "application/json" }
	});
}
async function POST(event) {
	const token = await getToken(event);
	const API_GATEWAY_URL = getEnv(event.platform, "API_GATEWAY_URL");
	const json = await event.request.json().catch(() => null);
	if (!json) return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });
	const res = await fetch(`${API_GATEWAY_URL}/pages`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify(json)
	});
	const body = await res.text();
	return new Response(body, {
		status: res.status,
		headers: { "content-type": "application/json" }
	});
}
//#endregion
export { GET, POST };
