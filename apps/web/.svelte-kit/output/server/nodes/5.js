import * as server from '../entries/pages/page/_id_/_page.server.ts.js';

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/page/_id_/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/page/[id]/+page.server.ts";
export const imports = ["_app/immutable/nodes/5.DIefK20J.js","_app/immutable/chunks/BfDR1WRM.js","_app/immutable/chunks/CneYPvlS.js","_app/immutable/chunks/kNaey6uv.js","_app/immutable/chunks/BpbgKSJb.js","_app/immutable/chunks/C0iRfMCQ.js","_app/immutable/chunks/xihTtKlq.js"];
export const stylesheets = [];
export const fonts = [];
