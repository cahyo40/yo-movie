'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MovieSlider from '@/components/MovieSlider';
import { db } from '@/utils/db';

const CATEGORIES = [
  { id: '872031290915189720', name: 'Trending Now 🔥' },
  { id: '997144265920760504', name: 'Film Populer 🎬' },
  { id: '5283462032510044280', name: 'Drama Indonesia Terkini 🇮🇩' },
  { id: '6528093688173053896', name: 'Trending Indonesian Movies 🍿' },
  { id: '4380734070238626200', name: 'K-Drama Terpopuler 🇰🇷' },
  { id: '5404290953194750296', name: 'Trending Anime 🌸' }
];

export default function Home() {
  const [heroMovie, setHeroMovie] = useState(null);
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [continueWatching, setContinueWatching] = useState([]);

  useEffect(() => {
    // 1. Load Continue Watching from local DB
    const resumeList = db.getResumeList();
    const resumeArray = Object.entries(resumeList)
      .map(([id, info]) => ({ id, ...info }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
    setContinueWatching(resumeArray);

    // 2. Fetch category feeds in parallel
    async function fetchFeeds() {
      try {
        const promises = CATEGORIES.map(async (cat) => {
          const res = await fetch(`/api/home?id=${cat.id}&page=1`);
          if (!res.ok) throw new Error(`Failed to fetch ${cat.name}`);
          const json = await res.json();
          return {
            id: cat.id,
            name: cat.name,
            items: json?.data?.subjectList || json?.data?.items || []
          };
        });

        const results = await Promise.allSettled(promises);
        const newSections = {};
        let trendingItems = [];

        results.forEach((res) => {
          if (res.status === 'fulfilled') {
            const data = res.value;
            newSections[data.id] = data;
            if (data.id === '872031290915189720') {
              trendingItems = data.items;
            }
          }
        });

        setSections(newSections);

        // Pick a random or first item from Trending as Hero
        if (trendingItems.length > 0) {
          // Find detail of first item for the description
          const heroItem = trendingItems[0];
          setHeroMovie({
            id: heroItem.subjectId,
            title: heroItem.title,
            cover: heroItem.cover?.url || heroItem.cover,
            description: heroItem.description || 'Masters of the Universe, K-Drama, and Anime, all streaming in high quality.',
            detailPath: heroItem.detailPath
          });
        }
      } catch (err) {
        console.error('[Home] Error fetching home feeds:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFeeds();
  }, []);

  return (
    <div className="home-container fadeIn">
      {/* 1. Hero Banner */}
      {loading ? (
        <div className="hero-skeleton skeleton"></div>
      ) : heroMovie ? (
        <section className="hero-banner">
          {/* Cover Overlay Background */}
          <div 
            className="hero-background"
            style={{ backgroundImage: `linear-gradient(to top, var(--color-background) 8%, rgba(9, 9, 11, 0.4) 60%, rgba(9, 9, 11, 0.7) 100%), url(${heroMovie.cover})` }}
          ></div>
          <div className="hero-content">
            <span className="hero-badge">Trending Hari Ini</span>
            <h1 className="hero-title">{heroMovie.title}</h1>
            <p className="hero-desc">{heroMovie.description}</p>
            <div className="hero-actions">
              <Link href={`/detail/${heroMovie.id}`} className="btn btn-primary">
                <span className="btn-icon">▶</span> Tonton Sekarang
              </Link>
              <Link href={`/detail/${heroMovie.id}`} className="btn btn-secondary glassmorphism">
                ℹ️ Info Selengkapnya
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* 2. Continue Watching (Lanjut Tonton) */}
      {!loading && continueWatching.length > 0 && (
        <section className="continue-section">
          <div className="continue-header">
            <h2 className="section-title">Lanjut Menonton</h2>
          </div>
          <div className="continue-grid">
            {continueWatching.map((item) => (
              <div className="continue-card glassmorphism" key={item.id}>
                {/* Individual Delete Button */}
                <button
                  className="delete-item-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.confirm(`Hapus "${item.title}" dari daftar lanjut menonton?`)) {
                      db.clearResume(item.id);
                      setContinueWatching(prev => prev.filter(c => c.id !== item.id));
                    }
                  }}
                  title="Hapus dari daftar"
                >
                  ✕
                </button>
                <Link href={`/detail/${item.id}?play=true&season=${item.season || 0}&episode=${item.episode || 0}`}>
                  <div className="continue-poster-wrapper">
                    <img src={item.cover} alt={item.title} className="continue-poster" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&auto=format&fit=crop'; }} />
                    <span className="continue-play">▶</span>
                  </div>
                  <div className="continue-info">
                    <h4 className="continue-title" title={item.title}>{item.title}</h4>
                    <p className="continue-sub">
                      {item.type === 'TvSeries' || item.season > 0 ? `S${item.season} E${item.episode}` : 'Film'}
                    </p>
                    <div className="continue-progress-bg">
                      <div className="continue-progress-bar" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Category Sliders */}
      {loading ? (
        <div className="sliders-skeleton">
          {[1, 2, 3].map((n) => (
            <div key={n} className="slider-skeleton-wrapper">
              <div className="skeleton-title skeleton"></div>
              <div className="skeleton-cards">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="skeleton-card skeleton"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="sliders-wrapper">
          {CATEGORIES.map((cat) => {
            const data = sections[cat.id];
            if (!data || data.items.length === 0) return null;
            return (
              <MovieSlider 
                key={cat.id} 
                title={cat.name} 
                movies={data.items}
                categoryId={cat.id}
              />
            );
          })}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .home-container {
          width: 100%;
        }

        /* Hero Skeleton */
        .hero-skeleton {
          width: 100%;
          height: 56.25vw; /* 16:9 ratio */
          max-height: 550px;
          min-height: 320px;
          border-radius: 0 0 16px 16px;
        }

        /* Hero Banner */
        .hero-banner {
          position: relative;
          width: 100%;
          height: 48vw; /* cinematic ratio */
          max-height: 580px;
          min-height: 350px;
          display: flex;
          align-items: flex-end;
          padding: var(--spacing-xxl) var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
          overflow: hidden;
        }

        .hero-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center 20%;
          z-index: 1;
          transition: transform 0.5s ease;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 650px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .hero-badge {
          display: inline-block;
          background-color: var(--color-primary);
          color: #000000;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 4px;
          margin-bottom: var(--spacing-sm);
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: var(--shadow-neon-gold);
        }
 
        .hero-title {
          font-size: clamp(28px, 5vw, 48px);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: var(--spacing-sm);
          letter-spacing: -1px;
          text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.9);
        }
 
        .hero-desc {
          font-size: clamp(14px, 1.8vw, 16px);
          color: #e4e4e7;
          margin-bottom: var(--spacing-lg);
          line-height: 1.5;
          text-shadow: 1px 1px 8px rgba(0, 0, 0, 0.9);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .hero-actions {
          display: flex;
          gap: var(--spacing-md);
        }

        .btn-icon {
          margin-right: var(--spacing-xs);
          font-size: 11px;
        }

        /* Continue Watching Section */
        .continue-section {
          padding: 0 var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }

        .continue-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .section-title {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 0;
          position: relative;
        }



        .continue-grid {
          display: flex;
          overflow-x: auto;
          gap: var(--spacing-md);
          padding-bottom: var(--spacing-md);
          scrollbar-width: none;
        }
        
        .continue-grid::-webkit-scrollbar {
          display: none;
        }

        .continue-card {
          flex: 0 0 240px;
          border-radius: 12px;
          overflow: hidden;
          transition: transform 0.2s ease;
          position: relative;
        }

        .continue-card:hover {
          transform: translateY(-4px);
        }

        .delete-item-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(9, 9, 11, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--color-text-muted);
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: all 0.2s ease;
          opacity: 0; /* Hidden by default, show on hover */
        }

        .continue-card:hover .delete-item-btn {
          opacity: 1;
        }

        .delete-item-btn:hover {
          background: rgba(239, 68, 68, 0.9);
          border-color: #ef4444;
          color: white;
          transform: scale(1.1);
        }

        .continue-card a {
          display: flex;
          padding: var(--spacing-xs);
          gap: var(--spacing-sm);
          align-items: center;
        }

        .continue-poster-wrapper {
          position: relative;
          width: 60px;
          height: 80px;
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .continue-poster {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .continue-play {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .continue-card:hover .continue-play {
          opacity: 1;
        }

        .continue-info {
          flex-grow: 1;
          min-width: 0;
        }

        .continue-title {
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 2px;
        }

        .continue-sub {
          font-size: 11px;
          color: var(--color-text-muted);
          margin-bottom: var(--spacing-sm);
        }

        .continue-progress-bg {
          width: 100%;
          height: 3px;
          background-color: rgba(255,255,255,0.15);
          border-radius: 2px;
          overflow: hidden;
        }

        .continue-progress-bar {
          height: 100%;
          background-color: var(--color-primary);
        }

        /* Sliders Skeleton */
        .sliders-skeleton {
          padding: 0 var(--spacing-lg);
        }

        .slider-skeleton-wrapper {
          margin-bottom: var(--spacing-xl);
        }

        .skeleton-title {
          width: 180px;
          height: 24px;
          margin-bottom: var(--spacing-md);
        }

        .skeleton-cards {
          display: flex;
          gap: var(--spacing-md);
        }

        .skeleton-card {
          flex: 0 0 180px;
          aspect-ratio: 2 / 3;
        }

        /* Responsive Breakpoints */
        @media (max-width: 768px) {
          .hero-banner {
            padding: var(--spacing-lg) var(--spacing-md);
            height: 60vw;
          }
          
          .continue-section {
            padding: 0 var(--spacing-md);
          }
          
          .continue-card {
            flex: 0 0 210px;
          }

          .skeleton-card {
            flex: 0 0 150px;
          }
        }

        @media (max-width: 480px) {
          .hero-banner {
            height: 70vw;
          }
          .hero-desc {
            display: none;
          }
          .hero-actions {
            flex-direction: column;
            gap: var(--spacing-xs);
            width: 100%;
            align-items: stretch;
          }
          .btn {
            width: 100%;
            display: flex;
            justify-content: center;
          }
          .skeleton-card {
            flex: 0 0 130px;
          }
        }
      ` }} />
    </div>
  );
}
