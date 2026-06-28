'use client';

import { useState, useEffect } from 'react';
import MovieCard from '@/components/MovieCard';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) throw new Error('Pencarian gagal');
        const data = await res.json();
        const items = data?.data?.items || [];
        // Deduplicate by subjectId to prevent React key warnings
        const seen = new Set();
        const unique = items.filter(item => {
          if (seen.has(item.subjectId)) return false;
          seen.add(item.subjectId);
          return true;
        });
        setResults(unique);
      } catch (err) {
        console.error('[Search] Error fetching search query:', err);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="search-container container fadeIn">
      <h1 className="page-title">Cari Film & Series</h1>

      {/* Search Input Bar */}
      <div className="search-bar-wrapper glassmorphism">
        <span className="search-icon">🔍</span>
        <input 
          type="text" 
          placeholder="Ketik judul film, anime, atau drama..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
          autoFocus
        />
        {query && (
          <button 
            className="clear-btn"
            onClick={() => setQuery('')}
            aria-label="Clear query"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search Content */}
      {loading ? (
        <div className="results-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="skeleton-card-wrapper">
              <div className="skeleton-card skeleton"></div>
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div>
          <p className="search-meta">Ditemukan {results.length} hasil untuk "{query}"</p>
          <div className="results-grid">
            {results.map((movie) => (
              <MovieCard movie={movie} key={movie.subjectId} />
            ))}
          </div>
        </div>
      ) : query.trim() ? (
        <div className="empty-state">
          <span className="empty-icon">😢</span>
          <h3>Tidak ada hasil ditemukan</h3>
          <p>Coba kata kunci lain atau periksa ejaan judul film Anda.</p>
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">🍿</span>
          <h3>Temukan Tontonan Favorit Anda</h3>
          <p>Mulai mengetik di atas untuk mencari ribuan film, serial TV, anime, dan drama Asia.</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .search-container {
          padding-top: 88px;
        }
 
        .page-title {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: var(--spacing-lg);
          letter-spacing: -0.5px;
        }
 
        .search-bar-wrapper {
          display: flex;
          align-items: center;
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: 12px;
          margin-bottom: var(--spacing-xl);
          background-color: rgba(24, 24, 27, 0.4);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
 
        .search-bar-wrapper:focus-within {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-glow);
        }

        .search-icon {
          font-size: 20px;
          margin-right: var(--spacing-md);
          color: var(--color-text-muted);
        }

        .search-input {
          flex-grow: 1;
          border: none;
          outline: none;
          color: var(--color-text-main);
          font-size: 16px;
          font-weight: 500;
        }

        .search-input::placeholder {
          color: var(--color-text-muted);
        }

        .clear-btn {
          color: var(--color-text-muted);
          font-size: 14px;
          padding: 4px;
          transition: color 0.2s ease;
        }

        .clear-btn:hover {
          color: var(--color-text-main);
        }

        .search-meta {
          font-size: 14px;
          color: var(--color-text-muted);
          margin-bottom: var(--spacing-md);
        }

        /* Results Grid */
        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          gap: var(--spacing-lg);
        }

        .skeleton-card-wrapper {
          width: 100%;
        }

        .skeleton-card {
          width: 100%;
          aspect-ratio: 2 / 3;
          border-radius: 12px;
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: var(--spacing-xxl) 0;
          color: var(--color-text-muted);
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: var(--spacing-md);
        }

        .empty-state h3 {
          color: var(--color-text-main);
          font-size: 18px;
          font-weight: 700;
          margin-bottom: var(--spacing-xs);
        }

        .empty-state p {
          font-size: 14px;
          max-width: 380px;
          line-height: 1.5;
        }

        /* Responsive Breakpoints */
        @media (max-width: 640px) {
          .results-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--spacing-md);
          }
          .page-title {
            font-size: 24px;
          }
        }
      ` }} />
    </div>
  );
}
