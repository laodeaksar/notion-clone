/// <reference types="svelte" />
/// <reference types="@sveltejs/kit" />

declare global {
  namespace App {
    interface Locals {
      user:         { id: string; email: string; name: string | null } | null;
      sessionToken: string | null;
    }
    interface PageData {
      user?:         { id: string; email: string; name: string | null } | null;
      pages?:        Array<{ id: string; title: string; parentId: string | null }>;
      sessionToken?: string | null;
    }
    interface Platform {
      env: {
        API_GATEWAY_URL:       string;
        JWT_SECRET:            string;
        PAGE_SERVICE_URL?:     string;
        AUTH_SERVICE_URL?:     string;
        BLOCK_SERVICE_URL?:    string;
        FILE_SERVICE_URL?:     string;
        GATEWAY_ORIGIN?:       string;
        AUTH_REQUIRED?:        string;
        ALLOWED_ORIGINS?:      string;
        [key: string]:         string | undefined;
      };
      context: { waitUntil(promise: Promise<unknown>): void };
      caches:  CacheStorage & { default: Cache };
    }
  }
}

export {};
