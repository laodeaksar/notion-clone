import { t as getEnv } from "../chunks/env.js";
//#region src/hooks.server.ts
/**
* Server-side session validation using better-auth.
*
* Reads the `better-auth.session_token` cookie set during login, then
* validates it by calling the API gateway's GET /auth/get-session endpoint
* (which proxies to the auth-service).  The resulting user is stored in
* `event.locals.user` and made available to all server-side loaders and
* actions without re-fetching the session on every sub-request.
*/
var handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get("better-auth.session_token");
	event.locals.user = null;
	event.locals.sessionToken = null;
	if (sessionToken) try {
		const API_GATEWAY_URL = getEnv(event.platform, "API_GATEWAY_URL");
		const res = await event.fetch(`${API_GATEWAY_URL}/auth/get-session`, { headers: {
			Authorization: `Bearer ${sessionToken}`,
			origin: "http://localhost:5000"
		} });
		if (res.ok) {
			const data = await res.json();
			if (data.user && data.session) {
				event.locals.user = {
					id: data.user.id,
					email: data.user.email,
					name: data.user.name ?? null
				};
				event.locals.sessionToken = sessionToken;
			} else event.cookies.delete("better-auth.session_token", { path: "/" });
		} else event.cookies.delete("better-auth.session_token", { path: "/" });
	} catch {
		event.locals.user = null;
	}
	return resolve(event);
};
//#endregion
export { handle };
