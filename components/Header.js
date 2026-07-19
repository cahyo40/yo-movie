'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navItems = [
    { name: 'Beranda', path: '/' },
    { name: 'Bookmark', path: '/bookmarks' },
    { name: 'Riwayat', path: '/history' },
    { name: 'Pengaturan', path: '/settings' }
  ];

  return (
    <header className={`netflix-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-left">
        <Link href="/" className="logo-brand">
          Yo<span>Movie</span>
        </Link>
        <nav className="header-nav">
          <ul>
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <li key={item.path}>
                  <Link 
                    href={item.path} 
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="header-right">
        {pathname !== '/search' && (
          <Link href="/search" className="search-icon-btn" title="Cari Film">
            🔍
          </Link>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .header-left {
          display: flex;
          align-items: center;
          gap: 40px;
        }

        .logo-brand {
          font-family: 'Outfit', sans-serif;
          font-size: 26px;
          font-weight: 900;
          color: var(--color-primary);
          letter-spacing: -1px;
          transition: transform 0.2s ease;
        }

        .logo-brand:hover {
          transform: scale(1.03);
          color: var(--color-primary-hover);
        }

        .logo-brand span {
          color: #ffffff;
        }

        .header-nav ul {
          display: flex;
          align-items: center;
          gap: 20px;
          list-style: none;
        }

        .nav-item {
          font-size: 14px;
          color: #e5e5e5;
          font-weight: 500;
          transition: color 0.3s ease, font-weight 0.2s ease;
          position: relative;
          padding: 6px 0;
        }

        .nav-item:hover {
          color: var(--color-primary-hover);
        }

        .nav-item.active {
          color: var(--color-primary);
          font-weight: 700;
        }

        .nav-item.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 3px;
          background-color: var(--color-primary);
          border-radius: 2px;
          box-shadow: var(--shadow-neon-gold);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .search-icon-btn {
          font-size: 18px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .search-icon-btn:hover {
          transform: scale(1.15);
        }

        .profile-avatar {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          background: linear-gradient(135deg, #dfb24f 0%, #a17c2f 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .profile-avatar:hover {
          transform: scale(1.08);
        }

        /* Collapse header nav on smaller tablets */
        @media (max-width: 800px) {
          .header-nav {
            display: none;
          }
          .header-left {
            gap: 20px;
          }
        }
      ` }} />
    </header>
  );
}
