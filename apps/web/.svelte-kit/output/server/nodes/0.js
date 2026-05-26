import * as server from '../entries/pages/_layout.server.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { server };
export const server_id = "src/routes/+layout.server.ts";
export const imports = ["_app/immutable/nodes/0.Cv-bWbsy.js","_app/immutable/chunks/BfDR1WRM.js","_app/immutable/chunks/CneYPvlS.js","_app/immutable/chunks/BpbgKSJb.js","_app/immutable/chunks/C0iRfMCQ.js","_app/immutable/chunks/xihTtKlq.js"];
export const stylesheets = ["_app/immutable/assets/0.VNo3NvR4.css"];
export const fonts = [];
