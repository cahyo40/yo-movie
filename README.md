# YoMovie (MovieBox) 🎬✨

YoMovie is a high-fidelity, premium streaming web application built with **Next.js** and **Vanilla CSS**. Drawing inspiration from Netflix's dark mode and modern cinema layouts, it incorporates a stunning "Gold & Charcoal" visual design, smooth animations, and robust media playback features.

## 🌟 Features

- **Premium Cinema Aesthetics**: Custom dark mode with gold neon accents, glassmorphic UI elements, and tailored typography.
- **Dynamic Hero Section**: Highlighting featured titles with interactive play options.
- **Personalized Experience**:
  - **Continue Watching**: Pick up right where you left off (synced automatically using custom Local Storage hooks).
  - **Bookmarks / Watchlist**: Save movies and series for later.
  - **Playback History**: Easily view your past watched content.
- **Advanced Video Player**:
  - Full **HLS (.m3u8)** streaming compatibility using `hls.js`.
  - Stream proxying & Subtitle proxying configurations to bypass CORS restrictions.
  - Custom responsive controls, speed control, theater mode, and clean overlay UI.
- **Navigation & Categories**: Explore content smoothly through categorized sliders and dedicated search filters.
- **PWA Ready**: Configurations for progressive web app behavior, including custom service workers (`sw.js`) and web app manifests.

## 🛠️ Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: Vanilla CSS (Tailored variables in `app/globals.css` for consistent design system tokens)
- **Libraries**:
  - `hls.js` - HTTP Live Streaming playback engine
  - `lucide-react` - Modern and clean iconography
- **State Management**: Local Storage hooks (`hooks/useLocalStorage.js`) for bookmarks, history, and settings.
- **Proxies**: Native Next.js API Routes for video stream and subtitle fetching.

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/cahyo40/yo-movie.git
   cd yo-movie
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```
├── app/                  # Next.js App Router pages and APIs
│   ├── api/              # API routes (stream proxies, movie details, source resolvers)
│   ├── bookmarks/        # Bookmark page
│   ├── category/         # Category listing
│   ├── detail/           # Movie/Series detailed specification
│   ├── history/          # Watch history logs
│   ├── search/           # Movie search component
│   └── settings/         # Configuration page
├── components/           # Custom reusable UI widgets (Header, VideoPlayer, Sliders)
├── docs/                 # Architectural specifications, PRDs, and design guidelines
├── hooks/                # Local storage and state synchronization hooks
├── public/               # Static assets, manifest.json, and PWA service workers
├── utils/                # Database/resolver helper services
└── package.json          # Dependency definition
```

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
