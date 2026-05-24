/// <reference types="svelte" />
/// <reference types="@sveltejs/kit" />

declare module '$env/static/public' {
  export const PUBLIC_API_GATEWAY_URL: string;
  export const PUBLIC_HOCUSPOCUS_URL: string;
}

declare module '$env/static/private' {
  export const API_GATEWAY_URL: string;
  export const JWT_SECRET: string;
}
