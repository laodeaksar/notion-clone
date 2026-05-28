export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["service-worker.js"]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.Bo4zk6Lt.js",app:"_app/immutable/entry/app.BunbCo34.js",imports:["_app/immutable/entry/start.Bo4zk6Lt.js","_app/immutable/chunks/CwBOHcJW.js","_app/immutable/chunks/BLhvmMq8.js","_app/immutable/entry/app.BunbCo34.js","_app/immutable/chunks/BLhvmMq8.js","_app/immutable/chunks/kNaey6uv.js","_app/immutable/chunks/xihTtKlq.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/auth/logout",
				pattern: /^\/api\/auth\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/logout/_server.ts.js'))
			},
			{
				id: "/api/comments",
				pattern: /^\/api\/comments\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/comments/_server.ts.js'))
			},
			{
				id: "/api/comments/[id]",
				pattern: /^\/api\/comments\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/comments/_id_/_server.ts.js'))
			},
			{
				id: "/api/comments/[id]/resolve",
				pattern: /^\/api\/comments\/([^/]+?)\/resolve\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/comments/_id_/resolve/_server.ts.js'))
			},
			{
				id: "/api/files",
				pattern: /^\/api\/files\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/files/_server.ts.js'))
			},
			{
				id: "/api/liveblocks-auth",
				pattern: /^\/api\/liveblocks-auth\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/liveblocks-auth/_server.ts.js'))
			},
			{
				id: "/api/pages",
				pattern: /^\/api\/pages\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/pages/_server.ts.js'))
			},
			{
				id: "/api/pages/[id]",
				pattern: /^\/api\/pages\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/pages/_id_/_server.ts.js'))
			},
			{
				id: "/api/search",
				pattern: /^\/api\/search\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/search/_server.ts.js'))
			},
			{
				id: "/api/upload",
				pattern: /^\/api\/upload\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/upload/_server.ts.js'))
			},
			{
				id: "/auth",
				pattern: /^\/auth\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/docs",
				pattern: /^\/docs\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/docs/_server.ts.js'))
			},
			{
				id: "/files",
				pattern: /^\/files\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/openapi.json",
				pattern: /^\/openapi\.json\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/openapi.json/_server.ts.js'))
			},
			{
				id: "/page/[id]",
				pattern: /^\/page\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/redoc",
				pattern: /^\/redoc\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/redoc/_server.ts.js'))
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
