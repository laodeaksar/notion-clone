import { r as nameFromPublicId } from "../../../chunks/utils2.js";
//#region src/routes/files/+page.server.ts
var load = async ({ fetch, url }) => {
	const folder = url.searchParams.get("folder") ?? "notion-clone";
	const cursor = url.searchParams.get("cursor") ?? void 0;
	const params = new URLSearchParams({
		folder,
		limit: "50"
	});
	if (cursor) params.set("cursor", cursor);
	try {
		const res = await fetch(`/api/files?${params}`);
		if (!res.ok) return {
			files: [],
			truncated: false,
			cursor: null,
			error: (await res.json().catch(() => ({ error: "Failed to load files" }))).error ?? "Failed to load files"
		};
		const data = await res.json();
		return {
			files: (data.items ?? []).map((item) => ({
				publicId: item.publicId,
				url: item.url,
				size: item.size,
				name: nameFromPublicId(item.publicId),
				uploadedAt: item.uploadedAt
			})),
			truncated: data.truncated ?? false,
			cursor: data.cursor ?? null,
			error: null
		};
	} catch (e) {
		return {
			files: [],
			truncated: false,
			cursor: null,
			error: "File service unavailable"
		};
	}
};
//#endregion
export { load };
