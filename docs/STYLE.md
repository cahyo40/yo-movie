# Style Guide: MovieBox Web Streaming

## Color Palette (Dark Theme Focus)
Kami merancang antarmuka bertema gelap sinematik yang elegan untuk mengurangi kelelahan mata saat menonton dalam kegelapan dan memberikan fokus maksimal pada konten video/poster.

| Token | HSL / Hex | Usage |
|---|---|---|
| `--color-background` | `hsl(240, 10%, 4%)` / `#09090b` | Latar belakang halaman utama |
| `--color-surface` | `hsl(240, 10%, 9%)` / `#18181b` | Latar belakang kartu, modal, sidebar |
| `--color-surface-hover` | `hsl(240, 6%, 15%)` / `#27272a` | Latar belakang elemen yang di-hover |
| `--color-primary` | `hsl(250, 89%, 65%)` / `#6366f1` | CTA, tombol putar, menu aktif |
| `--color-primary-hover` | `hsl(250, 89%, 75%)` / `#818cf8` | Hover state untuk tombol utama |
| `--color-accent` | `hsl(320, 89%, 60%)` / `#ec4899` | Badge genre, elemen dekoratif, sorotan |
| `--color-text-main` | `hsl(0, 0%, 95%)` / `#f4f4f5` | Teks utama, judul konten |
| `--color-text-muted` | `hsl(240, 5%, 65%)` / `#a1a1aa` | Teks sekunder, sinopsis, metadata |
| `--color-border` | `hsl(240, 6%, 15%)` / `#27272a` | Garis tepi, pembatas menu |
| `--color-rating` | `hsl(45, 93%, 47%)` / `#eab308` | Bintang rating IMDb |
| `--color-glass` | `rgba(24, 24, 27, 0.7)` | Efek glassmorphism pada header/overlay |

## Typography
Menggunakan font keluarga sans-serif modern (**Inter** atau **Outfit** yang dimuat via Google Fonts) untuk kenyamanan membaca metadata film.

| Role | Weight | Size | Line Height | Letter Spacing |
|---|---|---|---|---|
| Display Title (Hero) | 800 (Extra Bold) | 36px - 48px | 1.1 | `-0.02em` |
| Section Heading | 700 (Bold) | 24px - 28px | 1.2 | `-0.01em` |
| Card Title | 600 (Semi Bold) | 16px | 1.3 | `0` |
| Body Text (Sinopsis) | 400 (Regular) | 15px | 1.5 | `0` |
| Caption / Metadata | 400 (Regular) | 13px | 1.4 | `0.02em` |

## Spacing Scale
Gunakan kelipatan **8px** untuk konsistensi tata letak:
* `4px` (xxs) - Padding mikro (jarak rating & text)
* `8px` (xs) - Padding elemen kecil, border-radius tombol
* `12px` (sm) - Jarak antar elemen dalam kartu
* `16px` (md) - Padding kartu, jarak antar kontrol video
* `24px` (lg) - Padding halaman default, gap grid poster
* `32px` (xl) - Padding halaman lebar, jarak antar seksi beranda
* `48px` (xxl) - Jarak spasi hero banner

## Border Radius
* Tombol Kecil & Badge: `6px`
* Tombol Utama / Input: `8px`
* Kartu Poster Film: `12px`
* Modal Dialog & Overlay Player: `16px`
* Panel Kontrol Video Player: `12px` (melayang)

## Glassmorphism & Shadows
* **Efek Kaca**: `backdrop-filter: blur(12px); webkit-backdrop-filter: blur(12px); border: 1px solid var(--color-border);`
* **Bayangan Rendah (Elevated Cards)**: `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3);`
* **Bayangan Tinggi (Modals / Glows)**: `box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);`
* **Primary Glow**: `box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);` (untuk tombol putar atau banner aktif)

## Motion & Micro-Animations
* **Card Hover**: `transform: translateY(-8px) scale(1.02); transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);`
* **Fade In (Page/Image Load)**: `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }` dengan durasi `300ms ease-out`.
* **Pulse Shimmer (Skeleton)**: `@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }` untuk loading state.
* **Button Press**: `transform: scale(0.96); transition: transform 0.1s ease;`

## Responsive Breakpoints
* **Mobile (layar < 640px)**: Grid poster 2 kolom, navigasi bawah (bottom navigation), padding halaman 16px.
* **Tablet (layar 640px - 1024px)**: Grid poster 3-4 kolom, navigasi sidebar mini, padding halaman 24px.
* **Desktop (layar > 1024px)**: Grid poster 5-6 kolom, navigasi sidebar lengkap dengan teks, hero banner lebar.

## Iconography
* Set Ikon: **Lucide React** (`lucide-react`)
* Stroke Width: `2px` (default)
* Ukuran: `20px` untuk ikon di tombol/menu, `28px` untuk tombol kontrol player.
