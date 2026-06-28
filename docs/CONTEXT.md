# Project Context: MovieBox Web Streaming

> File ini adalah referensi cepat bagi AI Agent untuk melakukan re-orientasi status proyek di setiap sesi kerja baru.

## Deskripsi Singkat Proyek
Aplikasi web streaming media pribadi yang bertindak sebagai antarmuka pemutar video dan scraping API dari situs MovieBox (`moviebox.ph` & `fmoviesunblocked.net`). Fitur utama berfokus pada kemudahan akses, pemutaran video dengan subtitle, serta manajemen data lokal (riwayat tontonan, lanjut putar, bookmark per kategori kustom, serta ekspor/impor data JSON) tanpa database server demi kenyamanan dan kerahasiaan pribadi. Aplikasi ini juga dioptimalkan agar dapat diinstal sebagai Progressive Web App (PWA).

## Tech Stack
* **Framework**: Next.js App Router (JavaScript)
* **Styling**: Vanilla CSS (Global Variables + CSS Modules)
* **Video Playback**: HTML5 Video Player + `HLS.js` (pemutar berkas streaming `.m3u8`)
* **Icons**: `lucide-react`
* **Penyimpanan Lokal**: Browser `localStorage` dengan fitur Ekspor/Impor JSON manual.
* **PWA**: Web App Manifest (`manifest.json`) + Service Worker (`sw.js`) untuk caching offline.

## Berkas Perencanaan Kunci
| File | Deskripsi / Tujuan |
|---|---|
| `docs/PRD.md` | Product Requirements Document — Detail fitur & kebutuhan pengguna |
| `docs/STYLE.md` | Style Guide — Panduan visual, skema warna HSL, tipografi & animasi |
| `docs/RULES.md` | Project Rules — Konvensi koding, struktur folder, aturan API proxy |
| `docs/ARCHITECTURE.md` | Technical Architecture — Aliran data, pemetaan endpoint proxy, skema LocalStorage & PWA caching |
| `docs/CHECKLIST.md` | Implementation Checklist — Daftar tugas pengerjaan bertahap |

## Status Saat Ini
* **Fase**: `Phase 1: Foundation & API Proxy Set Up`
* **Pekerjaan Terakhir Selesai**: Menyusun dan memperbarui seluruh berkas dokumen perencanaan termasuk cakupan PWA di direktori `docs/`.
* **Langkah Berikutnya**: 
  1. Membaca opsi instalasi `create-next-app` via `--help`.
  2. Menginisialisasi proyek Next.js di direktori utama `./`.
  3. Memulai pembuatan API Route Handler untuk memintas CORS API MovieBox.

## Keputusan Penting
* **Penyimpanan Serverless**: Menyimpan data riwayat, bookmark, dan posisi tontonan di LocalStorage browser demi menjaga aplikasi tetap sederhana, cepat, aman, dan tanpa biaya server database.
* **Portabilitas Data**: Menggunakan fitur ekspor/impor JSON sebagai solusi sinkronisasi manual antar perangkat dan pencadangan data bagi pengguna pribadi.
* **Tanpa TailwindCSS**: Menggunakan CSS Vanilla murni dengan variabel terpusat untuk kebebasan desain visual penuh.
* **PWA & Service Worker**: Penerapan manifest PWA standalone dengan Service Worker custom untuk performa muat instan dan kemudahan akses dari layar beranda smartphone.
