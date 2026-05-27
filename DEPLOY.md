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
5. Server publik untuk hocuspocus backend (Replit VM, Fly.io, Railway, dll.)

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
| `INTERNAL_SECRET` | String acak untuk auth antar-service (min 32 karakter) |
| `CLOUDINARY_CLOUD_NAME` | Nama cloud Cloudinary (untuk file upload) |
| `CLOUDINARY_API_KEY` | API key Cloudinary |
| `CLOUDINARY_API_SECRET` | API secret Cloudinary |
| `HOCUSPOCUS_BACKEND_URL` | URL publik server hocuspocus, mis. `https://your-vm.replit.app` |

#### Tab "Variables" — nilai non-sensitif untuk Workers & web build:

| Nama Variable | Nilai |
|---------------|-------|
| `GATEWAY_ORIGIN` | `https://notion-clone-api.YOUR-SUBDOMAIN.workers.dev` |
| `AUTH_REQUIRED` | `true` |
| `ALLOWED_ORIGINS` | `https://notion-clone-web.pages.dev` (tambah custom domain jika ada) |
| `PUBLIC_API_GATEWAY_URL` | `https://notion-clone-api.YOUR-SUBDOMAIN.workers.dev` |
| `API_GATEWAY_URL` | `https://notion-clone-api.YOUR-SUBDOMAIN.workers.dev` |
| `PUBLIC_HOCUSPOCUS_URL` | `wss://hocuspocus-proxy.YOUR-SUBDOMAIN.workers.dev` |

> **Cara tahu subdomain:** Setelah deploy pertama berhasil, URL muncul di log GitHub Actions. Atau cek di Cloudflare dashboard → Workers.

> **Catatan:** Deploy pertama, biarkan Variables kosong dulu. Setelah semua service berhasil deploy dan URL-nya diketahui, baru isi Variables dan trigger ulang workflow (`workflow_dispatch`).

> **Web build:** `PUBLIC_API_GATEWAY_URL`, `API_GATEWAY_URL`, dan `PUBLIC_HOCUSPOCUS_URL` di-bake saat build oleh GitHub Actions (bukan dibaca runtime dari CF Pages dashboard). Jika URL berubah, update Variables lalu push ulang agar rebuild terjadi.

---

### Langkah 4 — Push ke `main` → Deploy Otomatis

```bash
git add .
git commit -m "chore: setup deploy"
git push origin main
```

GitHub Actions akan:
1. Jalankan **migrasi database** ke Neon — schema selalu up-to-date sebelum kode baru aktif
2. Deploy **auth**, **page**, **block**, **file**, dan **hocuspocus-proxy** secara **paralel** (setelah migrasi selesai)
3. Setelah kelimanya selesai, deploy **api-gateway**
4. Setelah gateway live, build dan deploy **web frontend** ke Cloudflare Pages

Pantau progress di tab **Actions** di GitHub repo.

---

### Urutan Deploy (diatur otomatis oleh workflow)

```
push to main
     │
     ▼
migrate-db  (drizzle-kit migrate → Neon)
     │
     ├── deploy-auth  ──┐
     ├── deploy-page  ──┤
     ├── deploy-block ──┤  (paralel)
     ├── deploy-file  ──┤
     └── deploy-hocus ──┘
                        │
                        ▼
                 deploy-gateway ──► CF Workers
                        │
                        ▼
                  deploy-web ──► Cloudflare Pages
```

> **Kenapa migrasi dulu?** Jika schema baru ditambahkan bersamaan dengan kode baru,
> urutan ini memastikan database sudah siap sebelum Workers aktif — mencegah error
> "column does not exist" saat traffic masuk di tengah deployment.

---

### Verifikasi Web (Cloudflare Pages)

Setelah job `deploy-web` hijau, frontend tersedia di:

```
https://notion-clone-web.pages.dev
```

> URL ini muncul di log GitHub Actions step "Deploy ke Cloudflare Pages". Bisa juga dicek di Cloudflare dashboard → **Workers & Pages** → **notion-clone-web**.

---

### Langkah 3.5 — Buat Project Cloudflare Pages (sekali saja)

Sebelum workflow pertama berjalan, buat project Pages lebih dulu agar wrangler bisa deploy:

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create**
2. Pilih tab **Pages** → **Connect to Git** (atau **Upload assets** untuk manual)
3. Beri nama project: `notion-clone-web`
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

### Verifikasi Hocuspocus Proxy

Cek health-check endpoint setelah proxy ter-deploy:

```
https://hocuspocus-proxy.YOUR-SUBDOMAIN.workers.dev/health
```

Response sukses (backend bisa dijangkau):
```json
{
  "status": "ok",
  "proxy": "ok",
  "backend": {
    "url": "https://your-vm.replit.app",
    "reachable": true,
    "latencyMs": 87
  }
}
```

Response degraded (proxy jalan tapi backend mati):
```json
{
  "status": "degraded",
  "proxy": "ok",
  "backend": {
    "url": "https://your-vm.replit.app",
    "reachable": false,
    "latencyMs": 5001,
    "error": "The operation was aborted due to timeout"
  }
}
```

---

### Trigger Deploy Manual (tanpa push)

Di GitHub repo → tab **Actions** → pilih workflow **Deploy to Cloudflare Workers** → klik **Run workflow**.

---

## Hocuspocus — Deploy Backend (Node.js Server)

Hocuspocus backend **tidak bisa** jalan di Cloudflare Workers biasa (butuh WebSocket stateful). Worker di atas hanya **proxy** — backend Node.js harus tetap jalan di server terpisah.

### Opsi hosting backend:

| Platform | Gratis | Catatan |
|----------|--------|---------|
| **Replit VM** | ✅ (dengan plan) | Paling mudah, sudah ter-setup |
| **Fly.io** | ✅ (256MB) | `fly launch` dari folder project |
| **Railway** | Terbatas | Auto-detect Node.js |
| **Render** | ✅ (spin-down) | Free tier mati setelah 15 menit idle |

### Deploy backend ke Replit VM

Jika menggunakan Replit Deployments (VM):

1. Klik tombol **Deploy** di Replit → pilih **Reserved VM**
2. Replit akan menjalankan `bash start.sh` (sudah include hocuspocus di port 1234)
3. URL publik Replit VM menjadi nilai `HOCUSPOCUS_BACKEND_URL`

### Deploy backend ke Fly.io

```bash
# Install flyctl jika belum ada
curl -L https://fly.io/install.sh | sh

# Dari root project
fly launch --dockerfile services/hocuspocus-service/Dockerfile \
           --name hocuspocus-backend \
           --no-deploy

# Set environment variables
fly secrets set DATABASE_URL="postgresql://..." JWT_SECRET="..." PORT=1234

# Deploy
fly deploy --dockerfile services/hocuspocus-service/Dockerfile
```

Setelah deploy, URL `https://hocuspocus-backend.fly.dev` menjadi nilai `HOCUSPOCUS_BACKEND_URL`.

---

## Deploy Hocuspocus Proxy ke CF Workers (Manual CLI)

Jika tidak menggunakan GitHub Actions:

```bash
# Masuk ke direktori worker
cd services/hocuspocus-service/worker

# Login ke Cloudflare (jika belum)
pnpm exec wrangler login

# Set secret backend URL
pnpm exec wrangler secret put HOCUSPOCUS_BACKEND_URL
# → masukkan URL publik backend, mis: https://your-vm.replit.app

# Deploy
pnpm exec wrangler deploy
```

Setelah deploy, worker tersedia di:
```
https://hocuspocus-proxy.YOUR-SUBDOMAIN.workers.dev
```

Verifikasi:
```bash
curl https://hocuspocus-proxy.YOUR-SUBDOMAIN.workers.dev/health
```

---

## Custom Domain untuk Cloudflare Pages

Secara default web tersedia di `https://notion-clone-web.pages.dev`. Jika ingin pakai domain sendiri (mis. `app.yourdomain.com`), ikuti langkah berikut.

### Prasyarat
- Domain sudah terdaftar dan nameserver-nya diarahkan ke Cloudflare (domain harus di-manage di Cloudflare DNS)
- Project Pages `notion-clone-web` sudah berhasil di-deploy minimal sekali

---

### Langkah 1 — Tambah Custom Domain di Cloudflare Pages

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages**
2. Klik project **notion-clone-web**
3. Buka tab **Custom domains**
4. Klik **Set up a custom domain**
5. Masukkan domain kamu, mis: `app.yourdomain.com`
6. Klik **Continue**

Cloudflare akan otomatis membuat DNS record `CNAME` yang mengarah ke `notion-clone-web.pages.dev`.

7. Klik **Activate domain**

Tunggu beberapa menit hingga SSL certificate diterbitkan otomatis.

---

### Langkah 2 — Update Environment Variables

Setelah custom domain aktif, update URL di GitHub Actions Variables agar frontend tahu alamat publiknya:

Buka repo GitHub → **Settings** → **Secrets and variables** → **Actions** → tab **Variables**:

| Nama Variable | Nilai Baru |
|---------------|-----------|
| `PUBLIC_API_GATEWAY_URL` | `https://notion-api.YOUR-SUBDOMAIN.workers.dev` *(tidak berubah)* |
| `PUBLIC_HOCUSPOCUS_URL` | `wss://hocuspocus-proxy.YOUR-SUBDOMAIN.workers.dev` *(tidak berubah)* |

> Tidak ada perubahan khusus yang diperlukan untuk domain web — Cloudflare Pages otomatis melayani domain baru tanpa rebuild.

---

### Langkah 3 — (Opsional) Custom Domain untuk API Gateway & Hocuspocus Proxy

Jika ingin pakai custom domain (mis. `api.yourdomain.com` dan `ws.yourdomain.com`):

1. Cloudflare dashboard → **Workers & Pages** → pilih worker
2. Tab **Settings** → **Triggers** → **Custom Domains**
3. Klik **Add Custom Domain** → masukkan domain
4. Cloudflare otomatis atur DNS dan SSL

Setelah aktif, update GitHub Actions Variables:

| Nama Variable | Nilai Baru |
|---------------|-----------|
| `API_GATEWAY_URL` | `https://api.yourdomain.com` |
| `PUBLIC_API_GATEWAY_URL` | `https://api.yourdomain.com` |
| `PUBLIC_HOCUSPOCUS_URL` | `wss://ws.yourdomain.com` |

Lalu trigger ulang workflow `deploy-web` agar build baru menggunakan URL tersebut.

---

### Langkah 4 — Verifikasi

Setelah semua aktif, buka:

```
https://app.yourdomain.com
```

Cek juga SSL certificate aktif (gembok hijau di browser). Jika belum aktif, tunggu maksimal 10 menit atau cek status di tab **Custom domains** di Cloudflare dashboard.

---

### Troubleshooting Custom Domain

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `DNS_PROBE_FINISHED_NXDOMAIN` | DNS belum propagasi | Tunggu 5-30 menit |
| `SSL_ERROR_RX_RECORD_TOO_LONG` | Certificate belum ready | Tunggu 5-10 menit lagi |
| Domain aktif tapi API gagal | `PUBLIC_API_GATEWAY_URL` belum diupdate | Update Variables → trigger ulang deploy-web |
| `ERR_TOO_MANY_REDIRECTS` | SSL mode Cloudflare konflik | Pastikan SSL mode = **Full (strict)** di Cloudflare |

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
cd services/hocuspocus-service/worker && pnpm exec wrangler deploy --dry-run --outdir dist
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
cd apps/web && CF_PAGES=1 pnpm build && pnpm exec wrangler pages deploy .svelte-kit/cloudflare --project-name=notion-clone-web
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
3. Beri nama project: `notion-clone-web`
4. Upload seluruh isi folder `apps/web/.svelte-kit/cloudflare/`
5. Klik **Deploy site**

### Langkah C — Set Secrets & Vars

Worker → **Settings** → **Variables and Secrets** → tambahkan sesuai tabel di atas.

Untuk Cloudflare Pages → **Settings** → **Environment variables** → tambahkan:

| Variable | Production |
|----------|-----------|
| `PUBLIC_API_GATEWAY_URL` | `https://notion-api.YOUR-SUBDOMAIN.workers.dev` |
| `PUBLIC_HOCUSPOCUS_URL` | `wss://hocuspocus-proxy.YOUR-SUBDOMAIN.workers.dev` |
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
| `Project not found` saat deploy Pages | Project `notion-clone-web` belum dibuat | Buat project di CF dashboard dulu (Langkah 3.5) |
| Halaman web blank / API gagal | `PUBLIC_API_GATEWAY_URL` belum diset | Tambahkan ke GitHub Variables dan redeploy |
| `Could not resolve` saat build web | Adapter belum terinstall | Jalankan `pnpm install` di root dulu |
| Hocuspocus `/health` → `degraded` | Backend server mati / tidak bisa dijangkau | Pastikan Node.js backend jalan dan `HOCUSPOCUS_BACKEND_URL` benar |
| WebSocket disconnect terus-menerus | Backend URL salah protokol | Pastikan URL pakai `https://` (bukan `ws://`) di `HOCUSPOCUS_BACKEND_URL` |
| `HOCUSPOCUS_BACKEND_URL is not configured` | Secret belum diset di CF Worker | Jalankan `wrangler secret put HOCUSPOCUS_BACKEND_URL` |
