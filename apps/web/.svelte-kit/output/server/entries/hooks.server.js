import { t as getEnv } from "../chunks/env.js";
//#region src/hooks.server.ts
async function verifyJWT(token, secret) {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return null;
		const [header, payload, sig] = parts;
		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey("raw", encoder.encode(secret), {
			name: "HMAC",
			hash: "SHA-256"
		}, false, ["verify"]);
		const sigBytes = Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
		if (!await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(`${header}.${payload}`))) return null;
		const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
		if (decoded.exp < Math.floor(Date.now() / 1e3)) return null;
		return decoded;
	} catch {
		return null;
	}
}
var handle = async ({ event, resolve }) => {
	const JWT_SECRET = getEnv(event.platform, "JWT_SECRET");
	const token = event.cookies.get("token");
	if (token) {
		const payload = await verifyJWT(token, JWT_SECRET);
		if (payload) event.locals.user = {
			id: payload.sub,
			email: payload.email,
			name: payload.name ?? null
		};
		else {
			event.locals.user = null;
			event.cookies.delete("token", { path: "/" });
		}
	} else event.locals.user = null;
	return resolve(event);
};
//#endregion
export { handle };
