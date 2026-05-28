import * as server from '../entries/pages/_layout.server.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { server };
export const server_id = "src/routes/+layout.server.ts";
export const imports = ["_app/immutable/nodes/0.CbkKuPKK.js","_app/immutable/chunks/BLhvmMq8.js","_app/immutable/chunks/CwBOHcJW.js","_app/immutable/chunks/DxVtKosk.js","_app/immutable/chunks/CiO_fQW9.js","_app/immutable/chunks/xihTtKlq.js"];
export const stylesheets = ["_app/immutable/assets/0.tr2ePomL.css"];
export const fonts = [];
