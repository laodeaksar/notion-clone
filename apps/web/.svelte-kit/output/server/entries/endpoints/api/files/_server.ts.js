import { t as getEnv } from "../../../../chunks/env.js";
import { t as signServerJWT } from "../../../../chunks/jwt.js";
//#region src/routes/api/files/+server.ts
function getToken(event) {
	const userToken = event.cookies.get("better-auth.session_token");
	if (userToken) return Promise.resolve(userToken);
	return signServerJWT(getEnv(event.platform, "JWT_SECRET"));
}
async function POST(event) {
	const { request } = event;
	const token = await getToken(event);
	const API_GATEWAY_URL = getEnv(event.platform, "API_GATEWAY_URL");
	if ((request.headers.get("content-type") ?? "").includes("multipart/form-data")) {
		const form = await request.formData();
		const res = await fetch(`${API_GATEWAY_URL}/upload`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token}` },
			body: form
		});
		const body = await res.text();
		return new Response(body, {
			status: res.status,
			headers: { "content-type": "application/json" }
		});
	}
	const json = await request.json().catch(() => null);
	if (!json) return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });
	const res = await fetch(`${API_GATEWAY_URL}/upload`, {
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
async function GET(event) {
	const { url } = event;
	const token = await getToken(event);
	const API_GATEWAY_URL = getEnv(event.platform, "API_GATEWAY_URL");
	const folder = url.searchParams.get("folder") ?? void 0;
	const cursor = url.searchParams.get("cursor") ?? void 0;
	const limit = url.searchParams.get("limit") ?? "50";
	const params = new URLSearchParams({ limit });
	if (folder) params.set("folder", folder);
	if (cursor) params.set("cursor", cursor);
	const res = await fetch(`${API_GATEWAY_URL}/upload?${params}`, { headers: { Authorization: `Bearer ${token}` } });
	const body = await res.text();
	return new Response(body, {
		status: res.status,
		headers: { "content-type": "application/json" }
	});
}
async function DELETE(event) {
	const { url } = event;
	const token = await getToken(event);
	const API_GATEWAY_URL = getEnv(event.platform, "API_GATEWAY_URL");
	const publicId = url.searchParams.get("publicId");
	if (!publicId) return new Response(JSON.stringify({ error: "Missing publicId" }), { status: 400 });
	const res = await fetch(`${API_GATEWAY_URL}/upload/${encodeURIComponent(publicId)}`, {
		method: "DELETE",
		headers: { Authorization: `Bearer ${token}` }
	});
	const body = await res.text();
	return new Response(body, {
		status: res.status,
		headers: { "content-type": "application/json" }
	});
}
//#endregion
export { DELETE, GET, POST };
