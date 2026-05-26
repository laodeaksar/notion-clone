import { t as getEnv } from "../../../chunks/env.js";
import { fail, redirect } from "@sveltejs/kit";
//#region src/routes/auth/+page.server.ts
var load = ({ locals }) => {
	if (locals.user) throw redirect(302, "/");
};
var actions = {
	login: async ({ request, cookies, fetch, platform }) => {
		const API_GATEWAY_URL = getEnv(platform, "API_GATEWAY_URL");
		const data = await request.formData();
		const email = data.get("email")?.toString().trim() ?? "";
		const password = data.get("password")?.toString() ?? "";
		if (!email || !password) return fail(400, {
			error: "Email and password are required",
			email
		});
		const res = await fetch(`${API_GATEWAY_URL}/auth/login`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				email,
				password
			})
		});
		const body = await res.json().catch(() => ({}));
		if (!res.ok) return fail(res.status, {
			error: body.error ?? "Invalid credentials",
			email
		});
		if (body.token) cookies.set("token", body.token, {
			httpOnly: true,
			path: "/",
			sameSite: "lax",
			maxAge: 3600 * 24 * 7
		});
		throw redirect(302, "/");
	},
	register: async ({ request, cookies, fetch, platform }) => {
		const API_GATEWAY_URL = getEnv(platform, "API_GATEWAY_URL");
		const data = await request.formData();
		const email = data.get("email")?.toString().trim() ?? "";
		const password = data.get("password")?.toString() ?? "";
		const name = data.get("name")?.toString().trim() || void 0;
		if (!email || !password) return fail(400, {
			error: "Email and password are required",
			email,
			name
		});
		if (password.length < 8) return fail(400, {
			error: "Password must be at least 8 characters",
			email,
			name
		});
		const regRes = await fetch(`${API_GATEWAY_URL}/auth/register`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				email,
				password,
				name
			})
		});
		const regBody = await regRes.json().catch(() => ({}));
		if (!regRes.ok) return fail(regRes.status, {
			error: regBody.error ?? "Registration failed",
			email,
			name
		});
		const loginRes = await fetch(`${API_GATEWAY_URL}/auth/login`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				email,
				password
			})
		});
		const loginBody = await loginRes.json().catch(() => ({}));
		if (loginRes.ok && loginBody.token) cookies.set("token", loginBody.token, {
			httpOnly: true,
			path: "/",
			sameSite: "lax",
			maxAge: 3600 * 24 * 7
		});
		throw redirect(302, "/");
	}
};
//#endregion
export { actions, load };
