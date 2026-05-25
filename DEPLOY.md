# Panduan Deploy ke Cloudflare Workers & Pages

Ada **dua cara** deploy — pilih salah satu:

| | GitHub Actions (otomatis) | Dashboard Manual |
|---|---|---|
| Trigger | Push ke `main` → deploy otomatis | Copy-paste bundle secara manual |
| Setup awal | ~10 menit | ~20 menit |
| Deploy berikutnya | Otomatis | Manual setiap kali ada update |
| **Rekomendasi** | ✅ | Hanya jika tidak pakai Git |

---

## Cara 1 — GitHub Actions (Otomatis)

### Prasyarat
1. Repo ini sudah di-push ke GitHub
2. Akun Cloudflare (gratis): [dash.cloudflare.com](https://dash.cloudflare.com)
3. Database Neon: [neon.tech](https://neon.tech) — untuk auth/page/block service
4. Cloudflare R2 bucket — untuk file service (buat di Cloudflare dashboard → R2)

---

### Langkah 1 — Buat Cloudflare API Token

1. Buka [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Klik **Create Token** → pilih template **Edit Cloudflare Workers**
3. Klik **Continue to Summary** → **Create Token**
4. **Salin token** — hanya tampil sekali!

---

### Langkah 2 — Siapkan KV Namespace (untuk rate limiting gateway)

Langkah ini hanya perlu dilakukan **sekali**:

1. Di Cloudflare dashboard → **Workers & Pages** → **KV**
2. Klik **Create namespace** → beri nama `RATE_LIMIT_KV` → **Add**
3. Salin **Namespace ID** yang muncul
4. Buka file `apps/api-gateway/wrangler.toml`, ganti:
   ```toml
   id = "GANTI-DENGAN-ID-DARI-WRANGLER"
   ```
   dengan ID yang baru disalin, lalu commit & push.

---

### Langkah 3 — Set Secrets di GitHub

Buka repo GitHub → **Settings** → **Secrets and variables** → **Actions**

#### Tab "Secrets" — tambahkan satu per satu:

| Nama Secret | Nilai |
|-------------|-------|
| `CLOUDFLARE_API_TOKEN` | Token dari Langkah 1 |
| `CLOUDFLARE_ACCOUNT_ID` | Salin dari [dash.cloudflare.com](https://dash.cloudflare.com) → kanan bawah: *Account ID* |
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require` |
| `JWT_SECRET` | String acak panjang (min 32 karakter) |
| `JWT_REFRESH_SECRET` | String acak panjang **berbeda** dari JWT_SECRET |
| `R2_PUBLIC_URL` | URL publik bucket R2 (mis. `https://pub-xxx.r2.dev`) |

#### Tab "Variables" — tambahkan (bukan secret, nilai boleh dilihat):

| Nama Variable | Nilai |
|---------------|-------|
| `AUTH_SERVICE_URL` | `https://auth-service.YOUR-SUBDOMAIN.workers.dev` |
| `PAGE_SERVICE_URL` | `https://page-service.YOUR-SUBDOMAIN.workers.dev` |
| `BLOCK_SERVICE_URL` | `https://block-service.YOUR-SUBDOMAIN.workers.dev` |
| `FILE_SERVICE_URL` | `https://file-service.YOUR-SUBDOMAIN.workers.dev` |
| `API_GATEWAY_URL` | `https://notion-api.YOUR-SUBDOMAIN.workers.dev` |
| `PUBLIC_API_GATEWAY_URL` | `https://notion-api.YOUR-SUBDOMAIN.workers.dev` |
| `PUBLIC_HOCUSPOCUS_URL` | `wss://YOUR-HOCUSPOCUS-HOST` |

> **Cara tahu subdomain:** Setelah deploy pertama berhasil, URL muncul di log GitHub Actions. Atau cek di Cloudflare dashboard → Workers.

> **Catatan:** Deploy pertama, biarkan Variables kosong dulu. Setelah semua 4 service berhasil deploy dan URL-nya diketahui, baru isi Variables dan trigger ulang workflow (`workflow_dispatch`).

---

### Langkah 4 — Push ke `main` → Deploy Otomatis

```bash
git add .
git commit -m "chore: setup deploy"
git push origin main
```

GitHub Actions akan:
1. Jalankan **migrasi database** ke Neon — schema selalu up-to-date sebelum kode baru aktif
2. Deploy **auth**, **page**, **block**, **file** service **secara paralel** (setelah migrasi selesai)
3. Setelah keempat selesai, deploy **api-gateway** secara otomatis
4. Deploy **web frontend** ke Cloudflare Pages secara paralel (tidak perlu tunggu service lain)

Pantau progress di tab **Actions** di GitHub repo.

---

### Urutan Deploy (diatur otomatis oleh workflow)

```
push to main
     │
     ├──► deploy-web  ──────────────────────────► Cloudflare Pages
     │
     ▼
migrate-db  (drizzle-kit migrate → Neon)
     │
     ├── deploy-auth  ──┐
     ├── deploy-page  ──┤  (paralel)
     ├── deploy-block ──┼──► deploy-gateway ──► Cloudflare Workers
     └── deploy-file  ──┘
```

> **Kenapa migrasi dulu?** Jika schema baru ditambahkan bersamaan dengan kode baru,
> urutan ini memastikan database sudah siap sebelum Workers aktif — mencegah error
> "column does not exist" saat traffic masuk di tengah deployment.

---

### Verifikasi Web (Cloudflare Pages)

Setelah job `deploy-web` hijau, frontend tersedia di:

```
https://notion-web.pages.dev
```

> URL ini muncul di log GitHub Actions step "Deploy ke Cloudflare Pages". Bisa juga dicek di Cloudflare dashboard → **Workers & Pages** → **notion-web**.

---

### Langkah 3.5 — Buat Project Cloudflare Pages (sekali saja)

Sebelum workflow pertama berjalan, buat project Pages lebih dulu agar wrangler bisa deploy:

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create**
2. Pilih tab **Pages** → **Connect to Git** (atau **Upload assets** untuk manual)
3. Beri nama project: `notion-web`
4. Klik **Save**

> Setelah project ada, GitHub Actions akan otomatis push ke project tersebut setiap kali ada push ke `main`.

---

### Verifikasi API Gateway

Setelah semua job hijau di GitHub Actions, buka:

```
https://notion-api.YOUR-SUBDOMAIN.workers.dev/ping
```

Response sukses:
```json
{
  "status": "ok",
  "service": "api-gateway",
  "region": "SIN",
  "upstreams": [
    { "name": "auth",  "status": "ok", "latencyMs": 45 },
    { "name": "page",  "status": "ok", "latencyMs": 32 },
    { "name": "block", "status": "ok", "latencyMs": 38 },
    { "name": "file",  "status": "ok", "latencyMs": 29 }
  ]
}
```

Swagger UI tersedia di:
```
https://notion-api.YOUR-SUBDOMAIN.workers.dev/docs
```

---

### Trigger Deploy Manual (tanpa push)

Di GitHub repo → tab **Actions** → pilih workflow **Deploy to Cloudflare Workers** → klik **Run workflow**.

---

## Cara 2 — Dashboard Manual (tanpa GitHub)

### Prasyarat
Sama seperti di atas, plus akses ke Replit shell untuk membuat bundle.

### Langkah A — Bundle semua service

Jalankan dari Replit shell:

```bash
cd services/auth-service  && pnpm exec wrangler deploy --dry-run --outdir dist
cd services/page-service  && pnpm exec wrangler deploy --dry-run --outdir dist
cd services/block-service && pnpm exec wrangler deploy --dry-run --outdir dist
cd services/file-service  && pnpm exec wrangler deploy --dry-run --outdir dist
cd apps/api-gateway       && pnpm exec wrangler deploy --dry-run --outdir dist
```

### Langkah A2 — Build web untuk Cloudflare Pages

```bash
# Di root project:
pnpm install
cd apps/web && pnpm build
# Output ada di: apps/web/.svelte-kit/cloudflare/
```

Lalu deploy manual:
```bash
cd apps/web && pnpm exec wrangler pages deploy .svelte-kit/cloudflare --project-name=notion-web
```

### Langkah B — Upload ke Dashboard (Workers)

Untuk setiap service:
1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Create Worker**
2. Beri nama, klik **Deploy**, lalu **Edit code**
3. Hapus semua kode → paste isi file `dist/index.js` hasil bundle
4. **Save and deploy**

### Langkah B2 — Upload web ke Cloudflare Pages (manual)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages**
2. Pilih **Upload assets**
3. Beri nama project: `notion-web`
4. Upload seluruh isi folder `apps/web/.svelte-kit/cloudflare/`
5. Klik **Deploy site**

### Langkah C — Set Secrets & Vars

Worker → **Settings** → **Variables and Secrets** → tambahkan sesuai tabel di atas.

Untuk Cloudflare Pages → **Settings** → **Environment variables** → tambahkan:

| Variable | Production |
|----------|-----------|
| `PUBLIC_API_GATEWAY_URL` | `https://notion-api.YOUR-SUBDOMAIN.workers.dev` |
| `PUBLIC_HOCUSPOCUS_URL` | `wss://YOUR-HOCUSPOCUS-HOST` |
| `API_GATEWAY_URL` | `https://notion-api.YOUR-SUBDOMAIN.workers.dev` |
| `JWT_SECRET` | (sama dengan JWT_SECRET di Workers) |

---

## Troubleshooting

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `Authentication error` di Actions | `CLOUDFLARE_API_TOKEN` salah | Buat token baru, update secret |
| `KV namespace not found` | ID di `wrangler.toml` masih placeholder | Ganti dengan ID dari Cloudflare KV dashboard |
| `500 Internal Server Error` | `DATABASE_URL` atau `JWT_SECRET` belum diset | Periksa tab Secrets di GitHub / Cloudflare |
| `upstream: unreachable` di `/ping` | URL service salah di Variables | Cek `*_SERVICE_URL` di GitHub Actions Variables |
| `401 Unauthorized` | `JWT_SECRET` berbeda antar service | Pastikan semua pakai secret yang sama |
| `Project not found` saat deploy Pages | Project `notion-web` belum dibuat | Buat project di CF dashboard dulu (Langkah 3.5) |
| Halaman web blank / API gagal | `PUBLIC_API_GATEWAY_URL` belum diset | Tambahkan ke GitHub Variables dan redeploy |
| `Could not resolve` saat build web | Adapter belum terinstall | Jalankan `pnpm install` di root dulu |
