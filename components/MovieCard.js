'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/utils/db';

export default function MovieCard({ movie }) {
  const [progress, setProgress] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  const { subjectId, title, cover, subjectType, releaseDate, imdbRatingValue, detailPath } = movie;
  const id = subjectId;
  const posterUrl = cover?.url || cover || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&auto=format&fit=crop';
  
  // Format release year
  const year = releaseDate ? releaseDate.substringBefore?.('-') || releaseDate.split('-')[0] : '';
  
  // Content Type Display
  const typeText = subjectType === 2 || movie.type === 'TvSeries' || movie.type === 'tv' ? 'Series' : 'Movie';
  
  // Check if there is continue watching progress
  useEffect(() => {
    const resumeInfo = db.getResume(id);
    if (resumeInfo && resumeInfo.percentage > 0) {
      setProgress(resumeInfo.percentage);
    }
  }, [id]);

  return (
    <div 
      className="card-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/detail/${id}`}>
        <div className="card-poster-container">
          {/* Poster Image */}
          <img 
            src={posterUrl} 
            alt={title} 
            className="card-poster"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&auto=format&fit=crop';
            }}
          />

          {/* Hover Overlay */}
          <div className={`card-overlay ${isHovered ? 'visible' : ''}`}>
            <span className="play-button-icon">▶</span>
          </div>

          {/* Type Badge */}
          <span className={`type-badge ${typeText.toLowerCase()}`}>{typeText}</span>

          {/* Rating Badge */}
          {imdbRatingValue && (
            <span className="rating-badge">
              ⭐ {parseFloat(imdbRatingValue).toFixed(1)}
            </span>
          )}

          {/* Continue Watching Progress Bar */}
          {progress !== null && (
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="card-info">
          <h3 className="card-title" title={title}>{title}</h3>
          <p className="card-meta">{year ? `${year} • ` : ''}{typeText}</p>
        </div>
      </Link>

      <style dangerouslySetInnerHTML={{ __html: `
        .card-wrapper {
          width: 100%;
          position: relative;
          cursor: pointer;
        }

        .card-poster-container {
          position: relative;
          width: 100%;
          aspect-ratio: 2 / 3;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: var(--shadow-low);
          transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease;
          background-color: var(--color-surface);
          flex-shrink: 0;
          border: 1.5px solid transparent;
        }

        .card-wrapper:hover .card-poster-container {
          transform: translateY(-6px) scale(1.06);
          box-shadow: var(--shadow-high), var(--shadow-glow);
          border-color: var(--color-primary);
        }

        .card-poster {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.5s ease;
        }

        .card-wrapper:hover .card-poster {
          transform: scale(1.05);
        }

        .card-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 2;
        }

        .card-overlay.visible {
          opacity: 1;
        }

        .play-button-icon {
          font-size: 36px;
          color: #000000;
          background-color: var(--color-primary);
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-left: 4px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
          transform: scale(0.8);
          transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .card-wrapper:hover .play-button-icon {
          transform: scale(1);
          background-color: var(--color-primary-hover);
        }

        .type-badge {
          position: absolute;
          top: var(--spacing-xs);
          left: var(--spacing-xs);
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          z-index: 3;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .type-badge.movie {
          background-color: var(--color-primary);
          color: #000000;
        }

        .type-badge.series {
          background-color: #ffd700;
          color: #000000;
        }

        .rating-badge {
          position: absolute;
          top: var(--spacing-xs);
          right: var(--spacing-xs);
          background-color: rgba(9, 9, 11, 0.85);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          color: var(--color-rating);
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          z-index: 3;
          border: 1px solid var(--color-border);
        }

        .progress-container {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background-color: rgba(255, 255, 255, 0.2);
          z-index: 4;
        }

        .progress-bar {
          height: 100%;
          background-color: var(--color-primary);
          box-shadow: 0 0 8px var(--color-primary);
        }

        .card-info {
          padding-top: var(--spacing-sm);
          height: 44px;
          overflow: hidden;
        }

        .card-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 2px;
          line-height: 1.3;
        }

        .card-meta {
          font-size: 11px;
          color: var(--color-text-muted);
          line-height: 1.3;
        }
      ` }} />
    </div>
  );
}
