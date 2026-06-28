# Product Requirements Document: MovieBox Web Streaming

## 1. Problem Statement
Pengguna ingin menonton film, drama, serial TV, dan anime dari provider MovieBox secara langsung melalui browser web tanpa harus menggunakan aplikasi mobile khusus atau emulator. Karena situs sumber memiliki batasan CORS dan proteksi HTTP referer, pemanggilan API langsung dari browser tidak dimungkinkan. Selain itu, sebagai pengguna pribadi, mereka membutuhkan cara untuk menyimpan daftar bookmark (berdasarkan kategori), riwayat menonton, dan melacak progres pemutaran video agar bisa melanjutkan tontonan di lain waktu, serta memindahkan data tersebut antar perangkat tanpa melibatkan server database eksternal. Mereka juga ingin website ini dapat diinstal di beranda HP/Desktop layaknya aplikasi native (PWA).

## 2. Proposed Solution
Sebuah aplikasi web streaming film modern berbasis **Next.js** yang menggabungkan:
1. **API Proxy (Backend Handlers)**: Menyediakan API lokal untuk melakukan *forwarding* request ke API `moviebox.ph` dan `fmoviesunblocked.net` dengan menyematkan header `Referer` dan `User-Agent` yang sesuai guna mengelabui proteksi keamanan mereka.
2. **Premium Cinematic Web Interface**: Tampilan gelap (Dark Mode) modern yang memikat dengan navigasi responsif, pencarian cepat, slider kategori, halaman detail media, dan video player terintegrasi.
3. **Local Storage Database**: Menyimpan data Riwayat, Bookmark per Kategori, dan Lanjut Putar langsung di browser.
4. **Data Portability (Import/Export)**: Fitur untuk mengekspor seluruh data lokal menjadi file JSON dan mengimpornya kembali untuk cadangan atau sinkronisasi antar perangkat secara manual.
5. **Progressive Web App (PWA)**: Menyertakan web manifest, service worker, ikon PWA, dan konfigurasi tema agar aplikasi dapat diinstal di smartphone (Android/iOS) dan desktop, memuat instan dengan cache aset statis, serta memiliki halaman offline fallback.

## 3. User Stories
1. **Menjelajah Konten**: Sebagai pengguna, saya ingin menjelajahi kategori populer di beranda (Trending, K-Drama, Anime, dll) agar dapat menemukan konten menarik dengan cepat.
2. **Pencarian**: Sebagai pengguna, saya ingin mencari film atau serial TV berdasarkan kata kunci untuk menemukan judul tertentu secara instan.
3. **Melihat Detail**: Sebagai pengguna, saya ingin melihat informasi detail film/serial (sinopsis, tahun rilis, genre, rating IMDb, pemeran, dan rekomendasi terkait) untuk memutuskan apakah akan menontonnya.
4. **Menonton dengan Subtitle**: Sebagai pengguna, saya ingin memutar video dengan kontrol lengkap dan memilih takarir (subtitle) dalam berbagai bahasa (terutama Bahasa Indonesia/Inggris).
5. **Bookmark per Kategori**: Sebagai pengguna, saya ingin mengelompokkan film/serial ke dalam kategori bookmark kustom (misal: "Favorit", "Tonton Nanti", "Rekomendasi Teman") agar koleksi saya terorganisir.
6. **Riwayat Menonton**: Sebagai pengguna, saya ingin melihat daftar film/serial yang baru saja saya buka/tonton untuk memudahkan navigasi kembali.
7. **Lanjut Putar (Resume)**: Sebagai pengguna, saya ingin video otomatis dilanjutkan dari posisi detik/menit terakhir saat saya membuka kembali film atau episode yang belum selesai saya tonton.
8. **Ekspor & Impor Data**: Sebagai pengguna, saya ingin mengunduh semua data riwayat, bookmark, dan progres pemutaran ke file JSON dan mengunggahnya di browser/perangkat lain agar data saya tidak hilang.
9. **Instal sebagai Aplikasi (PWA)**: Sebagai pengguna, saya ingin menginstal website ini ke layar utama HP atau desktop saya agar saya bisa membukanya secara instan dengan ikon aplikasi layaknya aplikasi native tanpa mengetikkan URL di browser.

## 4. Design & Aesthetics Summary
* **Gaya Visual**: Dark Mode premium bernuansa sinematik dengan latar belakang abu-abu arang sangat gelap (`#0d0d0f`), aksen neon ungu-indigo (`#6366f1`), efek kaca semi-transparan (*glassmorphism*), dan sudut membulat halus (*border-radius*).
* **Tipografi**: Menggunakan Google Font **Inter** atau **Outfit** yang bersih dan modern untuk keterbacaan tingkat tinggi.
* **Detail Visual**: Kartu film interaktif yang membesar secara halus (*scale transition*) saat di-hover dan efek transisi memudar (*fade-in*) yang mulus saat memuat konten.

## 5. Technical Summary
* **Frontend**: Next.js (React) App Router dengan komponen UI modular.
* **Styling**: Vanilla CSS dengan CSS Custom Properties (CSS variables) untuk kemudahan manajemen tema dan fleksibilitas penuh tanpa Tailwind.
* **Pemutar Video**: HTML5 Video Player dengan integrasi library **HLS.js`** untuk mendukung pemutaran berkas `.m3u8` (HTTP Live Streaming) secara *native* di semua browser.
* **Manajemen Data Lokal**: Utilitas Javascript terpusat untuk membaca/menulis ke `localStorage`.
* **API Proxy**: Next.js Route Handlers (`/app/api/...`) untuk mem-bypass batasan CORS.
* **PWA Assets**: File `public/manifest.json` berisi metadata PWA, ikon logo aplikasi, dan `public/sw.js` (Service Worker) untuk penanganan caching aset statis dan fallback halaman offline.

## 6. Testing Strategy
* **Verifikasi API Proxy**: Memastikan endpoint API lokal mengembalikan data JSON yang bersih dan sesuai dari situs target tanpa error CORS.
* **Penyimpanan Lokal**: Menguji fungsionalitas penulisan, penghapusan, dan pembaruan riwayat, bookmark, serta posisi *playback* video secara berkala ke `localStorage`.
* **Ekspor/Impor**: Memastikan skema JSON hasil ekspor valid, dapat diunduh, dan saat diimpor kembali dapat memulihkan seluruh status aplikasi.
* **Uji PWA (Lighthouse)**: Memeriksa tingkat kepatuhan PWA menggunakan Chrome DevTools (Lighthouse Audits) untuk memastikan manifest terdeteksi, ikon valid, *theme color* terkonfigurasi, dan service worker terdaftar dengan benar sehingga tombol "Install" muncul di browser.

## 7. Execution Phases
1. **Phase 1: Foundation & API Proxy Set Up** (Instalasi Next.js, pembuatan API proxy untuk home, search, detail, dan stream).
2. **Phase 2: Local Database & Shared UI** (Desain CSS, komponen navigasi, kartu film, serta sistem manajemen local storage).
3. **Phase 3: Core Features & Video Player** (Halaman detail, integrasi pemutar HLS.js, pelacak waktu tonton).
4. **Phase 4: Bookmark Kustom & Ekspor/Impor UI** (Modal manajemen kategori bookmark, panel ekspor/impor data JSON).
5. **Phase 5: PWA Integration & Offline Setup** (Pembuatan `manifest.json`, pendaftaran service worker `sw.js` untuk cache statis, konfigurasi tag meta PWA di `layout.jsx`, dan penyediaan halaman offline fallback).
6. **Phase 6: Polish & Visual Animations** (Animasi transisi, skeleton loaders, dan perbaikan tata letak responsif).

## 8. Out of Scope
* Sistem login pengguna / pendaftaran akun (user authentication) di sisi cloud.
* Penyimpanan database cloud (data di server).
* Fitur download video ke penyimpanan lokal pengguna.
