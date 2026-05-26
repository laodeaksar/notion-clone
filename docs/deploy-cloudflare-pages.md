# Deploy Web ke Cloudflare Pages via GitHub

## 1. Push Kode ke GitHub

Pastikan project sudah ada di repository GitHub. Kalau belum:

```bash
git init
git remote add origin https://github.com/username/nama-repo.git
git add .
git commit -m "initial commit"
git push -u origin main
```

---

## 2. Login ke Cloudflare Dashboard

Buka [dash.cloudflare.com](https://dash.cloudflare.com) dan login ke akun kamu.

---

## 3. Buka Cloudflare Pages

Di sidebar kiri klik **Workers & Pages** → klik tab **Pages** → klik tombol **Create a project**.

---

## 4. Hubungkan ke GitHub

- Pilih **Connect to Git**
- Klik **Connect GitHub** → authorize Cloudflare di GitHub
- Pilih repository project ini → klik **Begin setup**

---

## 5. Konfigurasi Build Settings

Isi form berikut:

| Field | Value |
|---|---|
| **Project name** | `notion-clone-web` (bebas) |
| **Production branch** | `main` |
| **Framework preset** | `SvelteKit` |
| **Build command** | `pnpm --filter @workspace/web build` |
| **Build output directory** | `apps/web/.svelte-kit/cloudflare` |
| **Root directory** | *(kosongkan — biarkan default root)* |

---

## 6. Tambahkan Environment Variables

Klik **Environment variables (advanced)** lalu tambahkan variabel berikut:

| Variable | Keterangan |
|---|---|
| `DATABASE_URL` | URL PostgreSQL kamu |
| `JWT_SECRET` | Secret key JWT |
| `GATEWAY_ORIGIN` | URL API gateway yang sudah di-deploy |
| `AUTH_REQUIRED` | `true` |
| `PAGE_SERVICE_URL` | URL page-service |
| `AUTH_SERVICE_URL` | URL auth-service |
| `BLOCK_SERVICE_URL` | URL block-service |
| `FILE_SERVICE_URL` | URL file-service |
| `ALLOWED_ORIGINS` | Domain frontend kamu |

---

## 7. Deploy

Klik **Save and Deploy**. Cloudflare akan otomatis:

1. Clone repo dari GitHub
2. Install dependencies dengan `pnpm`
3. Build SvelteKit app
4. Deploy ke edge network Cloudflare

---

## 8. Deploy Otomatis Selanjutnya

Setiap kali kamu `git push` ke branch `main`, Cloudflare Pages akan otomatis trigger build dan deploy ulang tanpa langkah manual.

---

> **Catatan penting:** Pastikan semua backend services (auth, page, block, file, gateway)
> sudah di-deploy ke Cloudflare Workers **sebelum** deploy web, karena frontend
> membutuhkan URL dari semua services tersebut sebagai environment variable.
