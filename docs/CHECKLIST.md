# Implementation Checklist: MovieBox Web Streaming

## Phase 1: Foundation & API Proxy Set Up
* [ ] Jalankan perintah bantuan `npx create-next-app@latest --help` untuk melihat opsi inisialisasi proyek Next.js.
* [ ] Inisialisasi proyek Next.js di direktori aktif (`./`) menggunakan konfigurasi JS murni, App Router, tanpa TailwindCSS, dan tanpa ESLint agar setup minimalis dan performan.
* [ ] Buat file konfigurasi `.env.local` untuk menyimpan variabel domain eksternal.
* [ ] Buat API Route Handler untuk halaman utama: `/app/api/home/route.js`
* [ ] Buat API Route Handler untuk pencarian: `/app/api/search/route.js`
* [ ] Buat API Route Handler untuk detail film/series: `/app/api/detail/route.js`
* [ ] Buat API Route Handler untuk tautan stream & subtitle: `/app/api/play/route.js`
* [ ] Lakukan verifikasi API Proxy menggunakan `curl` atau uji manual untuk memastikan respons JSON bebas CORS.

## Phase 2: Local Database, Shared Hooks & Layout
* [ ] Tulis sistem variabel warna dan reset global di `/app/globals.css` sesuai spesifikasi `STYLE.md`.
* [ ] Bangun layout utama di `/app/layout.jsx` yang menyertakan Sidebar navigasi (Beranda, Bookmark, Riwayat, Pengaturan) yang responsif (tata letak samping di desktop, navigasi bawah di mobile).
* [ ] Buat custom hook `/hooks/useLocalStorage.js` untuk mempermudah manipulasi data di `localStorage`.
* [ ] Buat utilitas manajemen database lokal terpusat `/utils/db.js` untuk menangani Riwayat, Bookmark per Kategori, dan data Lanjut Putar.

## Phase 3: Core UI & Homepage & Search
* [ ] Bangun komponen `/components/MovieCard.jsx` dengan hover effect premium dan indikator progres lanjut putar (jika ada).
* [ ] Bangun komponen `/components/MovieSlider.jsx` untuk menampilkan baris poster film yang dapat di-scroll secara horizontal dengan transisi mulus.
* [ ] Buat Halaman Beranda utama di `/app/page.jsx` untuk menampilkan beberapa baris slider film berdasarkan kategori `mainPage` (Trending, Popular, K-Drama, dll).
* [ ] Buat Halaman Pencarian di `/app/search/page.jsx` dengan bar pencarian yang responsif dan grid hasil pencarian.

## Phase 4: Detail Halaman & Video Player (HLS.js)
* [ ] Instal library pemutar video HLS: `npm install hls.js`
* [ ] Buat Halaman Detail Film/Series di `/app/detail/[id]/page.jsx` untuk menampilkan metadata lengkap, daftar bintang, tombol pemutar, daftar season & episode (jika berupa serial TV), dan daftar rekomendasi.
* [ ] Bangun komponen `/components/VideoPlayer.jsx` yang memanfaatkan `hls.js` untuk memutar stream `.m3u8` dan merender track subtitle.
* [ ] Hubungkan event `timeupdate` pada player video untuk memperbarui progres lanjut putar (`moviebox_resume`) di LocalStorage secara berkala (throttle / debounce).
* [ ] Tambahkan tombol "Lanjut Tonton" di halaman detail jika media tersebut memiliki riwayat tontonan yang belum selesai.

## Phase 5: PWA Integration & Offline Setup
* [ ] Buat file manifest aplikasi `public/manifest.json` yang berisi properti PWA, tema warna gelap, dan konfigurasi maskable icon.
* [ ] Buat/sediakan aset ikon PWA (`/public/icons/icon-192x192.png`, `/public/icons/icon-512x512.png`). Gunakan tool generate jika diperlukan.
* [ ] Tambahkan tautan manifest PWA, apple-touch-icon, dan meta tags (viewport, theme-color) di file metadata `layout.jsx`.
* [ ] Buat service worker `/public/sw.js` dengan strategi caching Cache-First untuk file CSS/JS statis, Network-Only untuk `/api/...` routes, serta offline fallback page.
* [ ] Tambahkan script pendaftaran service worker di `layout.jsx` saat aplikasi dimuat di sisi client.
* [ ] Uji fungsionalitas instalasi aplikasi (PWA) di Google Chrome/Edge (tombol instalasi muncul di address bar).

## Phase 6: Halaman Fitur Bookmark, Riwayat & Pengaturan (Import/Export)
* [ ] Buat Halaman Bookmark di `/app/bookmarks/page.jsx` yang memiliki filter berdasarkan tab kategori kustom (dan kemampuan menambah/menghapus kategori).
* [ ] Buat Halaman Riwayat di `/app/history/page.jsx` untuk menampilkan daftar tontonan terakhir beserta tombol "Hapus Semua Riwayat".
* [ ] Buat Halaman Pengaturan di `/app/settings/page.jsx` yang berisi panel impor/ekspor data JSON.
* [ ] Tulis fungsi validasi skema JSON di backend/frontend saat mengimpor file backup guna menjamin integritas data lokal.

## Phase 7: Polish, Loading States & UX
* [ ] Implementasikan komponen Skeleton Loader untuk beranda dan halaman detail agar transisi pemuatan data terasa sangat halus.
* [ ] Jalankan audit tata letak responsif pada emulator mobile untuk memastikan kegunaan navigasi bawah.
* [ ] Lakukan pembersihan kode, optimasi performa *render*, dan pastikan tidak ada kebocoran memori pada inisialisasi HLS.js.
