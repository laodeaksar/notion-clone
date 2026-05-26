import * as server from '../entries/pages/files/_page.server.ts.js';

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/files/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/files/+page.server.ts";
export const imports = ["_app/immutable/nodes/4.CWEm3TJ6.js","_app/immutable/chunks/BfDR1WRM.js","_app/immutable/chunks/xihTtKlq.js"];
export const stylesheets = [];
export const fonts = [];
