'use client';

import { useState, useEffect, use } from 'react';
import MovieCard from '@/components/MovieCard';

export default function CategoryPage({ params }) {
  const resolvedParams = use(params);
  const categoryId = resolvedParams.id;

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categoryName, setCategoryName] = useState('');

  const CATEGORY_NAMES = {
    '872031290915189720': 'Trending Now 🔥',
    '997144265920760504': 'Film Populer 🎬',
    '5283462032510044280': 'Drama Indonesia Terkini 🇮🇩',
    '6528093688173053896': 'Trending Indonesian Movies 🍿',
    '4380734070238626200': 'K-Drama Terpopuler 🇰🇷',
    '5404290953194750296': 'Trending Anime 🌸'
  };

  useEffect(() => {
    setCategoryName(CATEGORY_NAMES[categoryId] || 'Koleksi Film');
    fetchPage(1);
  }, [categoryId]);

  const fetchPage = async (pageNum) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`/api/home?id=${categoryId}&page=${pageNum}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      const items = json?.data?.subjectList || json?.data?.items || [];

      // Deduplicate
      if (pageNum === 1) {
        setMovies(items);
      } else {
        setMovies(prev => {
          const existingIds = new Set(prev.map(m => m.subjectId));
          const newItems = items.filter(m => !existingIds.has(m.subjectId));
          return [...prev, ...newItems];
        });
      }

      setHasMore(items.length >= 12);
      setPage(pageNum);
    } catch (err) {
      console.error('[Category] Error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  return (
    <div className="category-container container fadeIn">
      <h1 className="page-title">{categoryName}</h1>

      {loading ? (
        <div className="results-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="skeleton-card-wrapper">
              <div className="skeleton-card skeleton"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="results-grid">
            {movies.map((movie, index) => (
              <MovieCard movie={movie} key={`${movie.subjectId}-${index}`} />
            ))}
          </div>

          {hasMore && (
            <div className="load-more-wrapper">
              <button
                className="btn btn-secondary glassmorphism load-more-btn"
                onClick={() => fetchPage(page + 1)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <span className="btn-loading">⏳ Memuat...</span>
                ) : (
                  <span>Tampilkan Lebih Banyak</span>
                )}
              </button>
            </div>
          )}
        </>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .category-container {
          padding-top: 88px;
        }

        .page-title {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: var(--spacing-lg);
          letter-spacing: -0.5px;
        }

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

        .load-more-wrapper {
          display: flex;
          justify-content: center;
          margin-top: var(--spacing-xl);
          padding-bottom: var(--spacing-xl);
        }

        .load-more-btn {
          padding: var(--spacing-sm) var(--spacing-xxl);
          font-size: 14px;
          font-weight: 600;
          border-radius: 24px;
          transition: all 0.3s ease;
        }

        .load-more-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: var(--shadow-glow);
        }

        .load-more-btn:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .btn-loading {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

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
