# Audit Todo List — Notion Clone

> Dibuat dari hasil audit mendalam. Status diperbarui sesuai progress implementasi.
> Format: `[x]` = selesai, `[ ]` = belum dikerjakan.

---

## 🔴 P0 — Fix Sekarang (Critical / Blocker Production)

- [x] **SEC-01** — Ganti SHA-256 ke PBKDF2 untuk password hashing
  - File: `services/auth-service/src/services/auth.service.ts`
  - Detail: PBKDF2-SHA256, 310k iterasi, random 16-byte salt per user, timing-safe compare
  - Backward compat: SHA-256 legacy hash masih diterima, auto-upgrade ke PBKDF2 saat login

- [x] **SEC-02** — CORS wildcard dihapus di semua services
  - File: `apps/api-gateway/src/middleware/cors.ts` (restricted ke `ALLOWED_ORIGINS` env var)
  - File: semua `services/*/src/index.ts` (restricted ke `GATEWAY_ORIGIN`)

- [x] **SEC-03** — Page ownership enforcement
  - File: `packages/db/src/schema.ts` (tambah kolom `user_id` di tabel `pages`)
  - File: `packages/db/drizzle/0006_add_page_user_id.sql` (migration)
  - File: `services/page-service/src/repository/page.repo.ts` (semua query di-scope per userId)
  - File: `services/page-service/src/services/page.service.ts` (userId dipass ke semua ops)
  - File: `services/page-service/src/routes/pages.ts` (userId dari JWT context)

---

## 🟠 P1 — Kerjakan Minggu Ini

- [x] **INFRA-01** — Port mismatch di `.env.example` (8787 → 8080)
  - File: `.env.example`

- [x] **SEC-06** — Security headers (X-Frame-Options, HSTS, CSP, dll)
  - File: `apps/api-gateway/src/middleware/cors.ts` (`securityHeadersMiddleware`)
  - File: `apps/api-gateway/src/index.ts` (register middleware)

- [x] **SEC-04** — Gateway tidak forward auth header ke upstream services (bug pre-existing)
  - File: `apps/api-gateway/src/routes/pages.routes.ts` (helper `forwardAuth`, `requireAuth` di semua GET)

- [x] **PERF-01** — Breadcrumb N+1 sequential fetch dihapus
  - File: `services/page-service/src/repository/page.repo.ts` (recursive CTE `findAncestors`)
  - File: `services/page-service/src/services/page.service.ts` (`getAncestors`)
  - File: `services/page-service/src/routes/pages.ts` (`GET /:id/ancestors`)
  - File: `apps/api-gateway/src/routes/pages.routes.ts` (proxy `/pages/:id/ancestors`)
  - File: `apps/web/src/routes/page/[id]/+page.server.ts` (`Promise.all` paralel)

- [x] **PERF-02** — buildTree O(n²) diganti O(n) Map-based
  - File: `apps/web/src/lib/components/Sidebar.svelte`

- [ ] **SEC-04b** — Cookie `secure: true` tidak di-set
  - File: `apps/web/src/routes/auth/+page.server.ts`
  - Fix: tambah `secure: true` di kedua `cookies.set()` (login + register action)

- [ ] **SEC-05** — `JWT_SECRET` fallback ke `'dev-secret'` di production
  - File: `apps/api-gateway/src/config.ts`
  - Fix: throw error jika `NODE_ENV === 'production'` dan var tidak di-set

- [ ] **PERF-03** — Rate limiter instance baru per request (CF isolate inefficiency)
  - File: `apps/api-gateway/src/middleware/rate-limit.ts`
  - Fix: cache adapter dengan `WeakMap<object, RateLimiterAdapter>` keyed by `c.env`

- [ ] **INFRA-02** — `VITE_API_URL` salah di `docker-compose.yml`
  - File: `docker-compose.yml`
  - Fix: ganti `VITE_API_URL` → `PUBLIC_API_GATEWAY_URL`

- [ ] **SCALE-01** — Hocuspocus tidak horizontal-scalable (single-node bottleneck)
  - File: `services/hocuspocus-service/src/index.ts`
  - Fix: pastikan `@hocuspocus/extension-redis` aktif dengan `REDIS_URL` yang valid
  - Jalankan multiple instance via load balancer (sticky sessions untuk WS)

- [ ] **UX-01** — Sidebar tidak collapse di mobile
  - File: `apps/web/src/routes/+layout.svelte`, `Sidebar.svelte`
  - Fix: deteksi viewport width, auto-collapse sidebar di bawah `md` breakpoint

---

## 🟡 P2 — Backlog (Nanti)

- [ ] **SCALE-02** — Metrics in-memory tidak sync antar CF Workers isolates
  - File: `apps/api-gateway/src/middleware/metrics.ts`
  - Fix: ganti ke Cloudflare Analytics Engine atau Upstash untuk persistent metrics

- [ ] **QUAL-01** — `@workspace/ui` React package tidak dipakai (dead code)
  - Action: hapus `packages/ui/` dan remove dari `pnpm-workspace.yaml`

- [ ] **PERF-04** — Layout selalu fetch semua pages tanpa pagination
  - File: `apps/web/src/routes/+layout.server.ts`
  - Fix: tambah pagination cursor + virtualised list di sidebar untuk >500 pages

- [ ] **UX-02** — Error state saat `saveError = true` tidak menampilkan pesan jelas
  - File: `apps/web/src/routes/page/[id]/+page.svelte`
  - Fix: tampilkan toast/banner "Failed to save title, changes reverted"

- [ ] **A11Y-01** — `autofocus` di input sidebar melanggar WCAG (Svelte warning)
  - File: `apps/web/src/lib/components/Sidebar.svelte`
  - Fix: pakai `use:focus` action atau handle focus secara programatik post-render

- [ ] **A11Y-02** — `text-slate-400` kemungkinan tidak memenuhi WCAG AA contrast ratio 4.5:1
  - Action: audit dengan browser devtools / axe; ganti ke `text-slate-500` minimum

- [ ] **SEC-07** — Metrics endpoint `/metrics` terbuka tanpa auth
  - File: `apps/api-gateway/src/routes/docs.routes.ts` atau metrics handler
  - Fix: tambah `requireAuth` atau IP allowlist untuk endpoint metrics

- [ ] **SEC-08** — `highlightSnippet` menggunakan `{@html}` — audit XSS surface
  - File: `apps/web/src/lib/components/Sidebar.svelte`
  - Status: sudah ada `escapeHtml()` tapi perlu audit lebih lanjut agar tidak ada bypass

- [ ] **PERF-05** — Image upload masih pakai base64 di Editor (33% overhead)
  - File: `apps/web/src/lib/components/Editor.svelte`
  - Fix: ganti `readAsDataURL` → `FormData` multipart (endpoint sudah support di `/api/upload`)

- [ ] **DX-01** — `docker-compose.yml` tidak ada `healthcheck` untuk Postgres/Redis
  - File: `docker-compose.yml`
  - Fix: tambah `healthcheck` agar dependent services tidak start sebelum DB siap

---

## Referensi Implementasi

### Fix SEC-04b (cookie secure)
```typescript
// apps/web/src/routes/auth/+page.server.ts
cookies.set('token', body.token, {
  httpOnly: true,
  path:     '/',
  sameSite: 'lax',
  secure:   true,   // ← tambahkan ini
  maxAge:   60 * 60 * 24 * 7
});
```

### Fix SEC-05 (JWT_SECRET wajib di production)
```typescript
// apps/api-gateway/src/config.ts
export function getEnv(c, key, fallback) {
  const val = c.env?.[key];
  if (val) return val as string;
  if ((c.env as any)?.NODE_ENV === 'production') {
    throw new Error(`[gateway] Missing required env var: ${key}`);
  }
  return fallback;
}
```

### Fix PERF-03 (rate limiter caching)
```typescript
// apps/api-gateway/src/middleware/rate-limit.ts
const adapterCache = new WeakMap<object, RateLimiterAdapter>();

export const rateLimitMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const env = c.env as Partial<Bindings>;
  let adapter = adapterCache.get(env as object);
  if (!adapter) {
    adapter = createRateLimiter(env);
    adapterCache.set(env as object, adapter);
  }
  // ... rest of middleware
});
```
