import './globals.css';
import Link from 'next/link';
import Header from '@/components/Header';

export const viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: 'no',
};

export const metadata = {
  title: 'YoMovie Web Streaming',
  description: 'Aplikasi streaming media pribadi berkualitas tinggi',
  manifest: '/manifest.json',
  appleWebAppCapable: 'yes',
  appleWebAppStatusBarStyle: 'black-translucent',
};

export default function RootLayout({ children }) {
  // Mobile navigation links
  const navItems = [
    { name: 'Beranda', path: '/', icon: '🏠' },
    { name: 'Cari', path: '/search', icon: '🔍' },
    { name: 'Bookmark', path: '/bookmarks', icon: '🔖' },
    { name: 'Riwayat', path: '/history', icon: '⏳' },
    { name: 'Pengaturan', path: '/settings', icon: '⚙️' }
  ];

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                if (window.location.hostname === 'localhost') {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (let registration of registrations) {
                      registration.unregister();
                      console.log('[PWA] Service Worker unregistered on localhost');
                    }
                  });
                  if (window.caches) {
                    caches.keys().then(function(names) {
                      for (let name of names) caches.delete(name);
                    });
                  }
                } else {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(function(reg) {
                      console.log('[PWA] Service Worker registered with scope:', reg.scope);
                    }).catch(function(err) {
                      console.error('[PWA] Service Worker registration failed:', err);
                    });
                  });
                }
              }
            `
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <div className="app-container">
          {/* Netflix Style Sticky Header */}
          <Header />

          {/* Main Content Area */}
          <main className="main-content">
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="bottom-nav">
            <ul>
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link href={item.path} className="bottom-link">
                    <span className="bottom-icon">{item.icon}</span>
                    <span className="bottom-label">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .app-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            background-color: var(--color-background);
          }

          /* Main Content Layout */
          .main-content {
            flex-grow: 1;
            padding-bottom: 40px; /* buffer */
            min-height: 100vh;
            background-color: var(--color-background);
          }

          /* Bottom Nav Mobile */
          .bottom-nav {
            display: none;
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 64px;
            z-index: 1000;
            background-color: rgba(9, 9, 11, 0.95);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-top: 1px solid var(--color-border);
            border-radius: 0;
          }

          .bottom-nav ul {
            display: flex;
            justify-content: space-around;
            align-items: center;
            height: 100%;
            list-style: none;
          }

          .bottom-nav li {
            flex: 1;
            text-align: center;
          }

          .bottom-link {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--color-text-muted);
            font-size: 11px;
            transition: color 0.2s ease, transform 0.1s ease;
          }

          .bottom-link:hover {
            color: var(--color-primary-hover);
            transform: scale(1.05);
          }

          .bottom-icon {
            font-size: 18px;
            margin-bottom: 2px;
          }

          .bottom-label {
            font-weight: 500;
          }

          /* Responsive Breakpoints */
          @media (max-width: 640px) {
            .main-content {
              padding-bottom: 80px; /* space for bottom nav */
            }

            .bottom-nav {
              display: block;
            }
          }
        ` }} />
      </body>
    </html>
  );
}
