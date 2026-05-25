/// <reference types="svelte" />
/// <reference types="@sveltejs/kit" />

declare global {
  namespace App {
    interface Locals {
      user: { id: string; email: string; name: string | null } | null;
    }
    interface PageData {
      user?: { id: string; email: string; name: string | null } | null;
    }
  }
}

declare module '$env/dynamic/public' {
  export const PUBLIC_API_GATEWAY_URL: string;
  export const PUBLIC_HOCUSPOCUS_URL: string;
}

declare module '$env/dynamic/private' {
  export const API_GATEWAY_URL: string;
  export const JWT_SECRET: string;
}

export {};
