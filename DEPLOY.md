# Panduan Deploy ke Cloudflare Workers

Deploy **tanpa terminal** menggunakan Cloudflare Workers Dashboard.

---

## Prasyarat

1. Akun Cloudflare (gratis): [dash.cloudflare.com](https://dash.cloudflare.com)
2. Database Neon (gratis): [neon.tech](https://neon.tech) — untuk auth/page/block service
3. Akun Cloudinary (gratis): [cloudinary.com](https://cloudinary.com) — untuk file service

---

## Urutan Deploy (penting — ikuti urutan ini)

```
1. auth-service
2. page-service
3. block-service
4. file-service
5. api-gateway  ← deploy terakhir, butuh URL keempat service di atas
```

---

## Cara Deploy Setiap Service

### Langkah A — Buat Worker baru di Dashboard

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages**
2. Klik **Create** → **Create Worker**
3. Beri nama sesuai tabel di bawah, klik **Deploy**
4. Klik **Edit code** untuk membuka editor online

### Langkah B — Upload kode yang sudah di-bundle

Di Replit, jalankan perintah ini di shell untuk masing-masing service:

```bash
# Dari root workspace:
cd services/auth-service  && pnpm exec wrangler deploy --dry-run --outdir dist
cd services/page-service  && pnpm exec wrangler deploy --dry-run --outdir dist
cd services/block-service && pnpm exec wrangler deploy --dry-run --outdir dist
cd services/file-service  && pnpm exec wrangler deploy --dry-run --outdir dist
cd apps/api-gateway       && pnpm exec wrangler deploy --dry-run --outdir dist
```

File hasil bundle ada di `dist/index.js` masing-masing folder.

Di editor online Cloudflare:
1. Hapus semua kode yang ada
2. Copy-paste isi file `dist/index.js`
3. Klik **Save and deploy**

### Langkah C — Set Environment Variables (Secrets)

Setelah Worker berhasil deploy, klik tab **Settings** → **Variables and Secrets**.

#### auth-service
| Nama | Tipe | Nilai |
|------|------|-------|
| `DATABASE_URL` | Secret | `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require` |
| `JWT_SECRET` | Secret | string acak panjang (min 32 karakter) |
| `JWT_REFRESH_SECRET` | Secret | string acak panjang berbeda |

#### page-service & block-service
| Nama | Tipe | Nilai |
|------|------|-------|
| `DATABASE_URL` | Secret | URL database Neon (sama boleh) |
| `JWT_SECRET` | Secret | **Sama persis** dengan auth-service |

#### file-service
| Nama | Tipe | Nilai |
|------|------|-------|
| `CLOUDINARY_CLOUD_NAME` | Variable | nama cloud dari Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Secret | API key dari Cloudinary |
| `CLOUDINARY_API_SECRET` | Secret | API secret dari Cloudinary |

#### api-gateway
| Nama | Tipe | Nilai |
|------|------|-------|
| `AUTH_SERVICE_URL` | Variable | `https://auth-service.YOUR-SUBDOMAIN.workers.dev` |
| `PAGE_SERVICE_URL` | Variable | `https://page-service.YOUR-SUBDOMAIN.workers.dev` |
| `BLOCK_SERVICE_URL` | Variable | `https://block-service.YOUR-SUBDOMAIN.workers.dev` |
| `FILE_SERVICE_URL` | Variable | `https://file-service.YOUR-SUBDOMAIN.workers.dev` |
| `JWT_SECRET` | Secret | **Sama persis** dengan auth-service |

---

## Membuat KV Namespace untuk Rate Limiting (api-gateway)

Rate limiting gateway butuh Cloudflare KV:

1. Di dashboard → **Workers & Pages** → **KV**
2. Klik **Create namespace** → beri nama `RATE_LIMIT_KV` → **Add**
3. Kembali ke Worker `api-gateway` → **Settings** → **Bindings**
4. Klik **Add** → pilih **KV Namespace**
5. Variable name: `RATE_LIMIT_KV`, pilih namespace yang baru dibuat
6. Klik **Save**

---

## Verifikasi Deploy

Setelah semua service di-deploy, test dengan membuka URL di browser:

```
https://auth-service.YOUR-SUBDOMAIN.workers.dev/ping
https://page-service.YOUR-SUBDOMAIN.workers.dev/ping
https://block-service.YOUR-SUBDOMAIN.workers.dev/ping
https://file-service.YOUR-SUBDOMAIN.workers.dev/ping
https://api-gateway.YOUR-SUBDOMAIN.workers.dev/ping
```

Response sukses (`/ping` di api-gateway):
```json
{
  "status": "ok",
  "service": "api-gateway",
  "version": "0.0.1",
  "region": "SIN",
  "timestamp": "2024-11-01T10:00:00.000Z",
  "upstreams": [
    { "name": "auth",  "status": "ok", "latencyMs": 45, "region": "SIN" },
    { "name": "page",  "status": "ok", "latencyMs": 32, "region": "SIN" },
    { "name": "block", "status": "ok", "latencyMs": 38, "region": "SIN" },
    { "name": "file",  "status": "ok", "latencyMs": 29, "region": "SIN" }
  ]
}
```

Jika ada service `"status": "unreachable"` → periksa kembali URL di environment variables api-gateway.

---

## URL Swagger UI (API Docs)

Setelah api-gateway di-deploy:

```
https://api-gateway.YOUR-SUBDOMAIN.workers.dev/docs
```

---

## Nama Worker yang Disarankan

| Service | Nama Worker | URL Hasil |
|---------|------------|-----------|
| auth-service | `notion-auth` | `https://notion-auth.YOUR-SUBDOMAIN.workers.dev` |
| page-service | `notion-pages` | `https://notion-pages.YOUR-SUBDOMAIN.workers.dev` |
| block-service | `notion-blocks` | `https://notion-blocks.YOUR-SUBDOMAIN.workers.dev` |
| file-service | `notion-files` | `https://notion-files.YOUR-SUBDOMAIN.workers.dev` |
| api-gateway | `notion-api` | `https://notion-api.YOUR-SUBDOMAIN.workers.dev` |

---

## Custom Domain (Opsional)

Untuk menggunakan domain sendiri (misal `api.myapp.com`):

1. Worker → **Settings** → **Domains & Routes**
2. Klik **Add** → **Custom domain**
3. Masukkan domain, ikuti instruksi DNS

---

## Troubleshooting

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `500 Internal Server Error` | `DATABASE_URL` salah atau belum diset | Periksa tab Secrets |
| `401 Unauthorized` | `JWT_SECRET` berbeda antar service | Pastikan nilai sama persis |
| `503 Upstream service unavailable` | URL service salah di api-gateway | Periksa env vars `*_SERVICE_URL` |
| `upstream: unreachable` di `/ping` | Service belum di-deploy atau URL typo | Deploy service tersebut dulu |
