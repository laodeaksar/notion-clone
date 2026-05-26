//#region src/lib/server/env.ts
/**
* Reads an environment variable from platform.env (Cloudflare Pages runtime)
* with a fallback to process.env (Node.js / Replit).
*/
function getEnv(platform, key) {
	return (platform?.env)?.[key] ?? process.env[key] ?? "";
}
//#endregion
export { getEnv as t };
