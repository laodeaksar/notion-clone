
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 * 
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
	export const npm_command: string;
	export const COLORTERM: string;
	export const REPL_OWNER: string;
	export const BLOCK_SERVICE_URL: string;
	export const DATABASE_URL: string;
	export const NIXPKGS_ALLOW_UNFREE: string;
	export const npm_config_npm_globalconfig: string;
	export const __EGL_VENDOR_LIBRARY_FILENAMES: string;
	export const NODE: string;
	export const REPLIT_DOMAINS: string;
	export const LD_AUDIT: string;
	export const PGPORT: string;
	export const XDG_DATA_HOME: string;
	export const npm_config_verify_deps_before_run: string;
	export const REPL_OWNER_ID: string;
	export const PGPASSWORD: string;
	export const npm_config__jsr_registry: string;
	export const XDG_CONFIG_HOME: string;
	export const REPLIT_LD_AUDIT: string;
	export const REPLIT_ARTIFACT_ROUTER: string;
	export const REPLIT_CLI: string;
	export const npm_config_globalconfig: string;
	export const PWD: string;
	export const REPLIT_DB_URL: string;
	export const PORT: string;
	export const NIX_PATH: string;
	export const REPLIT_EXPO_DEV_DOMAIN: string;
	export const REPL_ID: string;
	export const AUTH_SERVICE_URL: string;
	export const HOME: string;
	export const LANG: string;
	export const CONNECTORS_HOSTNAME: string;
	export const REPL_IDENTITY: string;
	export const LS_COLORS: string;
	export const REPLIT_RIPPKGS_INDICES: string;
	export const npm_package_version: string;
	export const REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE: string;
	export const GIT_ASKPASS: string;
	export const PGUSER: string;
	export const pnpm_config_verify_deps_before_run: string;
	export const FILE_SERVICE_URL: string;
	export const REPLIT_CONTAINER: string;
	export const INIT_CWD: string;
	export const XDG_CACHE_HOME: string;
	export const npm_lifecycle_script: string;
	export const REPLIT_RTLD_LOADER: string;
	export const REPLIT_DEV_DOMAIN: string;
	export const TERM: string;
	export const npm_package_name: string;
	export const REPLIT_CLUSTER: string;
	export const REPLIT_BASHRC: string;
	export const npm_config_prefix: string;
	export const REPL_LANGUAGE: string;
	export const npm_config_frozen_lockfile: string;
	export const SESSION_SECRET: string;
	export const REPL_HOME: string;
	export const TZDIR: string;
	export const REPLIT_PID1_VERSION: string;
	export const DISPLAY: string;
	export const npm_lifecycle_event: string;
	export const SHLVL: string;
	export const REPLIT_NIX_CHANNEL: string;
	export const GIT_EDITOR: string;
	export const PGDATABASE: string;
	export const PROMPT_DIRTRIM: string;
	export const REPL_IN_MICROVM: string;
	export const LIBGL_DRIVERS_PATH: string;
	export const REPLIT_MODE: string;
	export const LOCALE_ARCHIVE: string;
	export const npm_config_user_agent: string;
	export const REPLIT_CONNECTORS_HOSTNAME: string;
	export const PNPM_SCRIPT_SRC_DIR: string;
	export const npm_execpath: string;
	export const REPLIT_PID2: string;
	export const PGHOST: string;
	export const npm_package_json: string;
	export const API_GATEWAY_URL: string;
	export const XDG_DATA_DIRS: string;
	export const REPL_IDENTITY_KEY: string;
	export const REPLIT_HELIUM_ENABLED: string;
	export const PATH: string;
	export const npm_config_node_gyp: string;
	export const DOCKER_CONFIG: string;
	export const GLIBC_TUNABLES: string;
	export const JWT_SECRET: string;
	export const npm_config_registry: string;
	export const REPL_PUBKEYS: string;
	export const npm_node_execpath: string;
	export const REPL_SLUG: string;
	export const OLDPWD: string;
	export const PAGE_SERVICE_URL: string;
	export const NODE_ENV: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 * 
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {
	export const PUBLIC_API_GATEWAY_URL: string;
	export const PUBLIC_HOCUSPOCUS_URL: string;
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * 
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
	export const env: {
		npm_command: string;
		COLORTERM: string;
		REPL_OWNER: string;
		BLOCK_SERVICE_URL: string;
		DATABASE_URL: string;
		NIXPKGS_ALLOW_UNFREE: string;
		npm_config_npm_globalconfig: string;
		__EGL_VENDOR_LIBRARY_FILENAMES: string;
		NODE: string;
		REPLIT_DOMAINS: string;
		LD_AUDIT: string;
		PGPORT: string;
		XDG_DATA_HOME: string;
		npm_config_verify_deps_before_run: string;
		REPL_OWNER_ID: string;
		PGPASSWORD: string;
		npm_config__jsr_registry: string;
		XDG_CONFIG_HOME: string;
		REPLIT_LD_AUDIT: string;
		REPLIT_ARTIFACT_ROUTER: string;
		REPLIT_CLI: string;
		npm_config_globalconfig: string;
		PWD: string;
		REPLIT_DB_URL: string;
		PORT: string;
		NIX_PATH: string;
		REPLIT_EXPO_DEV_DOMAIN: string;
		REPL_ID: string;
		AUTH_SERVICE_URL: string;
		HOME: string;
		LANG: string;
		CONNECTORS_HOSTNAME: string;
		REPL_IDENTITY: string;
		LS_COLORS: string;
		REPLIT_RIPPKGS_INDICES: string;
		npm_package_version: string;
		REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE: string;
		GIT_ASKPASS: string;
		PGUSER: string;
		pnpm_config_verify_deps_before_run: string;
		FILE_SERVICE_URL: string;
		REPLIT_CONTAINER: string;
		INIT_CWD: string;
		XDG_CACHE_HOME: string;
		npm_lifecycle_script: string;
		REPLIT_RTLD_LOADER: string;
		REPLIT_DEV_DOMAIN: string;
		TERM: string;
		npm_package_name: string;
		REPLIT_CLUSTER: string;
		REPLIT_BASHRC: string;
		npm_config_prefix: string;
		REPL_LANGUAGE: string;
		npm_config_frozen_lockfile: string;
		SESSION_SECRET: string;
		REPL_HOME: string;
		TZDIR: string;
		REPLIT_PID1_VERSION: string;
		DISPLAY: string;
		npm_lifecycle_event: string;
		SHLVL: string;
		REPLIT_NIX_CHANNEL: string;
		GIT_EDITOR: string;
		PGDATABASE: string;
		PROMPT_DIRTRIM: string;
		REPL_IN_MICROVM: string;
		LIBGL_DRIVERS_PATH: string;
		REPLIT_MODE: string;
		LOCALE_ARCHIVE: string;
		npm_config_user_agent: string;
		REPLIT_CONNECTORS_HOSTNAME: string;
		PNPM_SCRIPT_SRC_DIR: string;
		npm_execpath: string;
		REPLIT_PID2: string;
		PGHOST: string;
		npm_package_json: string;
		API_GATEWAY_URL: string;
		XDG_DATA_DIRS: string;
		REPL_IDENTITY_KEY: string;
		REPLIT_HELIUM_ENABLED: string;
		PATH: string;
		npm_config_node_gyp: string;
		DOCKER_CONFIG: string;
		GLIBC_TUNABLES: string;
		JWT_SECRET: string;
		npm_config_registry: string;
		REPL_PUBKEYS: string;
		npm_node_execpath: string;
		REPL_SLUG: string;
		OLDPWD: string;
		PAGE_SERVICE_URL: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 * 
 * ```
 * 
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		PUBLIC_API_GATEWAY_URL: string;
		PUBLIC_HOCUSPOCUS_URL: string;
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
