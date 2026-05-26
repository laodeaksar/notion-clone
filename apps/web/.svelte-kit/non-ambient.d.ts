
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/auth" | "/api/auth/logout" | "/api/files" | "/api/pages" | "/api/pages/[id]" | "/api/search" | "/api/upload" | "/auth" | "/files" | "/page" | "/page/[id]";
		RouteParams(): {
			"/api/pages/[id]": { id: string };
			"/page/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string | undefined };
			"/api": { id?: string | undefined };
			"/api/auth": Record<string, never>;
			"/api/auth/logout": Record<string, never>;
			"/api/files": Record<string, never>;
			"/api/pages": { id?: string | undefined };
			"/api/pages/[id]": { id: string };
			"/api/search": Record<string, never>;
			"/api/upload": Record<string, never>;
			"/auth": Record<string, never>;
			"/files": Record<string, never>;
			"/page": { id?: string | undefined };
			"/page/[id]": { id: string }
		};
		Pathname(): "/" | "/api/auth/logout" | "/api/files" | "/api/pages" | `/api/pages/${string}` & {} | "/api/search" | "/api/upload" | "/auth" | "/files" | `/page/${string}` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}