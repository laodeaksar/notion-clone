import { t as getEnv } from "../../../../chunks/env.js";
import { error } from "@sveltejs/kit";
//#region src/routes/page/[id]/+page.server.ts
var load = async ({ params, fetch, platform }) => {
	const { id } = params;
	if (!id) error(400, "Page ID is required");
	const API_GATEWAY_URL = getEnv(platform, "API_GATEWAY_URL");
	const [pageRes, ancestorsRes] = await Promise.all([fetch(`${API_GATEWAY_URL}/pages/${id}`), fetch(`${API_GATEWAY_URL}/pages/${id}/ancestors`)]);
	if (pageRes.status === 404) error(404, "Page not found");
	if (!pageRes.ok) error(pageRes.status, "Failed to load page");
	const [{ page }, ancestorsBody] = await Promise.all([pageRes.json(), ancestorsRes.ok ? ancestorsRes.json() : Promise.resolve({ ancestors: [] })]);
	return {
		page,
		ancestors: ancestorsBody.ancestors ?? []
	};
};
//#endregion
export { load };
