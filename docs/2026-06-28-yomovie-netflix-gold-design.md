# Dokumen Desain: YoMovie - Netflix Black & Gold Edition

Dokumen ini mendefinisikan arsitektur visual, skema warna, tata letak navigasi, dan fungsionalitas kualitas "Auto" untuk aplikasi streaming pribadi **YoMovie**.

---

## 🎨 1. Sistem Desain Visual (Tema Hitam & Emas)

Untuk memberikan nuansa premium, eksklusif, dan sinematik mewah, aplikasi menggunakan palet warna Hitam & Emas (Black & Gold):

* **Latar Belakang Utama**: Hitam Pekat (`#09090b` / `rgba(10, 10, 10, 1)`)
* **Latar Belakang Permukaan**: Abu-abu Sangat Gelap (`#18181b` / `rgba(24, 24, 27, 0.95)`)
* **Warna Aksen / Brand Gold**: Emas Klasik (`#d4af37` / `hsl(45, 64%, 52%)`)
* **Warna Emas Menyala (Hover/Focus)**: Emas Terang (`#f3cd5b` / `hsl(45, 85%, 65%)`)
* **Teks Utama**: Putih Murni (`#f4f4f5`)
* **Teks Sekunder**: Abu-abu Muted (`#a1a1aa`)
* **Border / Pembatas**: Transparan Gelap (`rgba(255, 255, 255, 0.08)`)

---

## 🗂️ 2. Tata Letak Navigasi Atas (Netflix Top Bar)

Aplikasi akan memindahkan navigasi dari sidebar ke bar atas yang melayang (sticky top-bar) untuk memaksimalkan lebar layar tontonan.

* **Mode Transparan ke Hitam**:
  * Saat berada di posisi paling atas halaman beranda, Navigasi Atas berwarna transparan agar menyatu dengan latar belakang Hero Billboard.
  * Saat halaman di-scroll ke bawah (jarak > 50px), Navigasi Atas bertransisi menjadi hitam solid dengan efek blur (`backdrop-filter: blur(12px)`) untuk menjaga keterbacaan menu.
* **Menu Navigasi**:
  * Kiri: Logo **YoMovie** tebal berwarna emas (`YoMovie`), diikuti tautan horizontal: *Beranda*, *Cari*, *Bookmark*, *Riwayat*, *Pengaturan*.
  * Kanan: Profil/Aset Miniatur.
  * Navigasi Mobile: Di layar mobile (< 640px), navigasi atas tetap mempertahankan menu Cari dan Bookmark, sedangkan sisa menunya dilipat ke dalam panel mobile atau menggunakan Bottom Nav minimalis berwarna hitam emas.

---

## 🎬 3. Hero Billboard & Hover Card Zoom

* **Billboard Rekomendasi**:
  * Menampilkan cuplikan film pilihan utama dengan latar belakang gambar 16:9 yang memudar ke bawah menggunakan `linear-gradient(to top, #09090b, transparent)`.
  * Judul film besar, ringkasan cerita pendek, rating bintang emas, dan tombol "Putar" (emas solid) & "Info" (gelap semi-transparan).
* **Hover Card Zoom**:
  * Kartu film dalam baris horizontal akan membesar secara halus saat di-hover (`transform: scale(1.15); z-index: 10`).
  * Bayangan menyala berwarna emas halus (`box-shadow: 0 10px 20px rgba(212, 175, 55, 0.15)`) akan memancar di sekitar kartu saat aktif.
  * Deskripsi mikro (match %, rating, tipe) muncul pada kartu yang membesar.

---

## 📶 4. Resolusi "Auto" (Adaptive Quality Router)

Pemilih resolusi pada pemutar video akan dilengkapi dengan opsi **Auto** (pilihan default) dengan logika pemilihan cerdas:

1. **Estimasi Bandwidth Client**:
   * Membaca `navigator.connection` (atau `navigator.mozConnection` / `navigator.webkitConnection`).
   * Mengukur `downlink` (kecepatan Mbps) dan `effectiveType` (kategori jaringan 2G/3G/4G).
2. **Pemilihan Resolusi Otomatis**:
   * Koneksi lambat (< 1.5 Mbps atau 2G/3G) -> Otomatis memilih kualitas **360P** / terendah.
   * Koneksi sedang (1.5 - 4 Mbps) -> Otomatis memilih kualitas **480P** / **720P**.
   * Koneksi cepat (> 4 Mbps atau 4G) -> Otomatis memilih kualitas **1080P** / tertinggi.
3. **Kompatibilitas HLS (.m3u8)**:
   * Jika aliran adalah HLS, atur `hls.currentLevel = -1` agar HLS.js mengatur adaptive streaming bawaannya secara internal.

---

## 🛠️ 5. Rencana Penerapan Berkas

1. [MODIFY] [globals.css](file:///home/cahyo/Vibe%20Coding/moviebox/app/globals.css) - Memperbarui skema warna (CSS variables) ke Hitam-Emas, membuat header transparan, hover card zoom, dan loader emas.
2. [MODIFY] [layout.js](file:///home/cahyo/Vibe%20Coding/moviebox/app/layout.js) - Mengubah struktur sidebar desktop menjadi Top Navigation Bar bergaya Netflix.
3. [MODIFY] [VideoPlayer.js](file:///home/cahyo/Vibe%20Coding/moviebox/components/VideoPlayer.js) - Menambahkan opsi "Auto" pada pilihan resolusi dan mengintegrasikan detektor bandwidth.
