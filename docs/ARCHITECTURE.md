# Architecture: MovieBox Web Streaming

## Overview
Aplikasi ini dirancang dengan arsitektur **Server-Client Hybrid** yang terintegrasi di dalam satu proyek Next.js, diperluas dengan kemampuan **Progressive Web App (PWA)** agar dapat diinstal dan dijalankan layaknya aplikasi native.
* **Server-Side (API Proxy)**: Bertanggung jawab untuk menjembatani request dari client ke API eksternal MovieBox (`moviebox.ph` dan `fmoviesunblocked.net`). Server-side ini diperlukan untuk memintas CORS dan menyisipkan header HTTP (`Referer` dan `User-Agent`) yang wajib diikutsertakan agar server target tidak menolak koneksi.
* **Client-Side (React Application)**: Bertanggung jawab untuk menyajikan antarmuka pengguna, mengontrol jalannya pemutaran video menggunakan `HLS.js`, serta mengelola database lokal (`localStorage`) untuk riwayat tontonan, bookmark per kategori, progres lanjut putar, dan impor/ekspor data JSON.
* **PWA Layer (Service Worker & Manifest)**: Bertanggung jawab untuk membuat web dapat diinstal (installable), mendaftarkan service worker untuk meng-cache aset-aset statis (HTML shell, CSS, JS, Ikon) agar memuat instan, serta menyajikan halaman fallback jika pengguna kehilangan koneksi internet.

---

## Diagram Aliran Data

```mermaid
graph TD
    Client[Browser Client] -->|Static Assets CSS/JS/Images| SW{Service Worker Cache}
    SW -->|Cache Hit| BrowserCache[Local Cache Store]
    SW -->|Cache Miss| NetworkRequest[Network Request]
    
    Client -->|Fetch Home, Search, Detail| APIProxy[Next.js API Routes]
    Client -->|Local Storage| BrowserDB[(Local Storage)]
    
    subgraph Server Side (Next.js Node.js)
        APIProxy -->|Inject Headers & Referer| TargetAPI1[Moviebox API]
        APIProxy -->|Inject Headers & Referer| TargetAPI2[FMoviesUnblocked API]
    end
    
    subgraph Target Streaming Services
        TargetAPI1 -->|Return Media List & Details| APIProxy
        TargetAPI2 -->|Return Stream Links & Captions| APIProxy
    end

    APIProxy -->|Return Clean JSON Data| Client
    Client -->|Direct Streaming .m3u8| VideoPlayer[HLS Video Player]
```

---

## Pemetaan Endpoint API Proxy

Berikut adalah detail endpoint internal yang akan kita buat di `/app/api/...`:

### 1. `/api/home`
* **Method**: `GET`
* **Params**: `id` (Kategori ID), `page` (Halaman)
* **Target URL**: `https://moviebox.ph/wefeed-h5-bff/web/ranking-list/content?id={id}&page={page}&perPage=12`
* **Headers**: `User-Agent` desktop umum.

### 2. `/api/search`
* **Method**: `POST`
* **Body**: `{ keyword }`
* **Target URL**: `https://moviebox.ph/wefeed-h5-bff/web/subject/search`
* **Headers**: `Content-Type: application/json` & `User-Agent`.

### 3. `/api/detail`
* **Method**: `GET`
* **Params**: `id` (Subject ID)
* **Target URL**: 
  * Info Detail: `https://moviebox.ph/wefeed-h5-bff/web/subject/detail?subjectId={id}`
  * Rekomendasi: `https://moviebox.ph/wefeed-h5-bff/web/subject/detail-rec?subjectId={id}&page=1&perPage=12`
* **Logika**: Backend menggabungkan data detail film/series, daftar episode/season, daftar bintang/aktor, dan daftar rekomendasi menjadi satu buah payload respons JSON yang rapi.

### 4. `/api/play`
* **Method**: `GET`
* **Params**: `id` (Subject ID), `season` (Musim, default 0), `episode` (Episode, default 0), `detailPath` (untuk pembuatan referer header)
* **Target URL**:
  * Tautan Stream: `https://fmoviesunblocked.net/wefeed-h5-bff/web/subject/play?subjectId={id}&se={season}&ep={episode}`
* **Headers Penting**:
  * `Referer`: `https://fmoviesunblocked.net/spa/videoPlayPage/movies/{detailPath}?id={id}&type=/movie/detail&lang=en`
* **Logika**:
  1. Ambil URL stream.
  2. Dari respons stream pertama, ambil parameter `id` dan `format` stream, lalu panggil endpoint caption untuk mendapatkan subtitle:
     `https://fmoviesunblocked.net/wefeed-h5-bff/web/subject/caption?format={format}&id={streamId}&subjectId={id}`
  3. Kirim kembali kombinasi link stream video dan daftar subtitle ke browser client.

---

## Spesifikasi Progressive Web App (PWA)

### 1. Web App Manifest (`public/manifest.json`)
Menyediakan informasi metadata aplikasi agar terdeteksi oleh browser sebagai aplikasi yang dapat diinstal:
* `name`: "MovieBox Streaming"
* `short_name`: "MovieBox"
* `start_url`: "/"
* `display`: "standalone" (menghilangkan navigasi address bar browser)
* `orientation`: "any" (mendukung rotasi otomatis untuk memutar video layar penuh)
* `background_color`: "#09090b" (sesuai warna latar belakang `--color-background`)
* `theme_color`: "#09090b"
* `icons`: Menyediakan ikon beresolusi `192x192` dan `512x512` dengan format PNG dan properti `"purpose": "any maskable"`.

### 2. Service Worker (`public/sw.js`)
Service worker didaftarkan pada client side saat pemuatan halaman pertama (`layout.jsx`). Strategi caching yang digunakan:
* **Statically Cached Assets**: Caching berkas statis lokal (HTML Shell offline fallback, CSS global, JS bundler, serta gambar ikon utama). Menggunakan strategi **Cache-First** agar memuat instan.
* **API Requests**: Next.js API Routes (`/api/...`) menggunakan strategi **Network-Only** (tidak boleh di-cache agar data film selalu diperbarui secara real-time dan menghindari pemborosan ruang penyimpanan browser).
* **Offline Fallback**: Jika jaringan terputus saat mencoba membuka halaman selain pemutar video, service worker akan merender halaman offline bawaan yang memberi tahu pengguna untuk menyalakan koneksi internet.

---

## Logika Pemutaran Video & Takarir (HLS.js)
Format link streaming video yang disediakan oleh API target menggunakan ekstensi `.m3u8` (HTTP Live Streaming / HLS). Karena sebagian besar browser desktop (Chrome, Firefox, Edge) tidak mendukung pemutaran HLS secara bawaan:
* Kita akan mengintegrasikan **HLS.js** di sisi client.
* Komponen `VideoPlayer` akan mendeteksi kemampuan browser. Jika mendukung HLS secara native (seperti Safari di macOS/iOS), gunakan elemen `<video>` bawaan. Jika tidak, inisialisasi instance `Hls` dari library `hls.js` dan hubungkan dengan elemen `<video>`.
* Komponen player juga memuat berkas subtitle `.vtt` atau `.srt` yang didapatkan dari API, dan merendernya secara native menggunakan tag `<track>` di dalam elemen `<video>`.

---

## Penyimpanan & Pemulihan Data Browser (LocalStorage)
Skema data JSON yang disimpan di LocalStorage diatur sebagai berikut:

### 1. Bookmarks (`moviebox_bookmarks`)
```json
{
  "bookmarks": [
    {
      "id": "8720312909",
      "title": "Film Keren",
      "cover": "https://...",
      "type": "movie",
      "category": "Favorit"
    }
  ],
  "categories": ["Favorit", "Tonton Nanti", "Rekomendasi"]
}
```

### 2. Riwayat Menonton (`moviebox_history`)
```json
[
  {
    "id": "8720312909",
    "title": "Film Keren",
    "cover": "https://...",
    "type": "movie",
    "timestamp": 1690000000000
  }
]
```

### 3. Lanjut Putar (`moviebox_resume`)
```json
{
  "8720312909": {
    "season": 0,
    "episode": 0,
    "time": 1205.45,
    "duration": 5400.0,
    "percentage": 22.3,
    "title": "Film Keren",
    "cover": "https://...",
    "updatedAt": 1690000000000
  }
}
```

### 4. Ekspor / Impor Logika
Tombol **Export Data** akan mengumpulkan ketiga entri `localStorage` di atas, menggabungkannya ke dalam satu objek JSON:
```json
{
  "version": "1.0",
  "exportedAt": "2026-06-28T03:00:00Z",
  "data": {
    "bookmarks": { ... },
    "history": [ ... ],
    "resume": { ... }
  }
}
```
Mengunduh berkas ini sebagai `moviebox-data-backup.json`. Tombol **Import Data** akan membaca file JSON tersebut, memvalidasi struktur propertinya, lalu menyimpannya kembali ke masing-masing key di `localStorage`.
