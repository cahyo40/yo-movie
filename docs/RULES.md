# Project Rules: MovieBox Web Streaming

## General Principles
* **Single Responsibility**: Setiap komponen React harus berfokus pada satu tugas utama (misal: `VideoPlayer`, `MovieCard`, `SearchBar`).
* **CORS Safety**: Dilarang keras memanggil URL `moviebox.ph` atau `fmoviesunblocked.net` langsung dari sisi client (browser) karena akan gagal terkena CORS. Gunakan selalu API Route Proxy Next.js `/api/...` yang telah dibuat di sisi server.
* **Semantic HTML**: Gunakan tag HTML5 yang tepat (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`) demi aksesibilitas dan SEO.
* **No Magic Strings/Numbers**: Simpan URL API dan konfigurasi lainnya di file konfigurasi terpusat atau variabel lingkungan (.env).
* **Code Format**: Gunakan ES6+ JavaScript/TypeScript modern yang bersih dengan sintaks *arrow functions* dan *async/await*.

## Naming Conventions
* **Komponen React**: Menggunakan PascalCase (misal: `MovieCard.jsx`, `Layout.jsx`).
* **Fungsi & Variabel**: Menggunakan camelCase (misal: `fetchMovies`, `isLoading`, `currentEpisode`).
* **File Style (CSS)**: Menggunakan kebab-case untuk file global (`globals.css`) dan format nama modul (`[ComponentName].module.css`) untuk CSS Modules.
* **Variabel Lingkungan (Env)**: Menggunakan SCREAMING_SNAKE_CASE (misal: `NEXT_PUBLIC_SITE_URL`).

## Folder Structure
Struktur Next.js App Router yang bersih dan modular:
```
moviebox/
├── app/                  # Next.js App Router
│   ├── api/              # API Route Handlers (CORS Proxy)
│   │   ├── home/         # Kategori beranda
│   │   ├── search/       # Fitur pencarian
│   │   ├── detail/       # Detail film/series
│   │   └── play/         # Tautan streaming & subtitle
│   ├── bookmarks/        # Halaman bookmark
│   ├── history/          # Halaman riwayat menonton
│   ├── watch/            # Halaman pemutar video (player)
│   ├── globals.css       # CSS Variabel & Reset Global
│   ├── layout.jsx        # Tata letak utama (Sidebar & Navbar)
│   └── page.jsx          # Beranda Utama
├── components/           # Komponen UI Reusable
│   ├── MovieCard.jsx
│   ├── MovieSlider.jsx
│   ├── VideoPlayer.jsx
│   └── Modal.jsx
├── hooks/                # Custom React Hooks
│   ├── useLocalStorage.js# Sinkronisasi state dengan LocalStorage
│   └── useHls.js         # Inisialisasi & kontrol HLS.js
├── utils/                # Fungsi pembantu utilitas
│   └── helper.js
├── docs/                 # Dokumen perencanaan proyek
└── package.json
```

## CSS / Styling Rules
* **No TailwindCSS**: Tulis CSS Vanilla murni. Gunakan CSS Custom Properties (CSS variables) di `app/globals.css` untuk warna, font, dan spacing.
* **CSS Modules**: Gunakan CSS Modules (`.module.css`) untuk mencegah konflik nama kelas CSS antar komponen.
* **Bahan Animasi**: Gunakan `transition` dan `will-change` secara efisien pada properti berkinerja tinggi (`transform`, `opacity`) untuk animasi 60 FPS yang mulus.

## Local Storage Rules (History, Bookmark, Lanjut Putar)
* Gunakan satu *key namespace* yang bersih untuk masing-masing fitur:
  * `moviebox_history`: Menyimpan riwayat film/episode yang dibuka (maksimal 100 entri terbaru).
  * `moviebox_bookmarks`: Menyimpan data bookmark beserta kategorinya.
  * `moviebox_resume`: Menyimpan progres detik/menit terakhir pemutaran video (`{ mediaId: { season, episode, time, duration } }`).
* **Import/Export Validation**: Sebelum mengimpor file JSON eksternal ke dalam `localStorage`, validasi struktur datanya terlebih dahulu agar tidak merusak aplikasi jika pengguna mengunggah file yang rusak.

## Git Commit Conventions
* Gunakan format pesan komit yang deskriptif:
  * `feat: ...` untuk fitur baru.
  * `fix: ...` untuk perbaikan bug.
  * `style: ...` untuk perubahan tampilan/CSS.
  * `docs: ...` untuk dokumentasi.
  * `refactor: ...` untuk penataan ulang kode.
