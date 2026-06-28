'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import MovieCard from './MovieCard';

export default function MovieSlider({ title, movies, categoryId }) {
  const sliderRef = useRef(null);
  const [showLeftBtn, setShowLeftBtn] = useState(false);
  const [showRightBtn, setShowRightBtn] = useState(true);

  // Check scroll position to hide/show scroll buttons
  const checkScrollPosition = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setShowLeftBtn(scrollLeft > 5);
      // Math.ceil is used to prevent rounding issues in high-DPI displays
      setShowRightBtn(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener('scroll', checkScrollPosition);
      // Run once initially
      checkScrollPosition();
      
      // Also listen to window resize
      window.addEventListener('resize', checkScrollPosition);
    }
    return () => {
      if (slider) {
        slider.removeEventListener('scroll', checkScrollPosition);
      }
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [movies]);

  const scroll = (direction) => {
    if (sliderRef.current) {
      const { clientWidth } = sliderRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      sliderRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="slider-container">
      <div className="slider-header">
        <h2 className="slider-title">{title}</h2>
        {categoryId && (
          <Link href={`/category/${categoryId}`} className="show-more-link">
            Lihat Semua ›
          </Link>
        )}
      </div>

      <div className="slider-relative-wrapper">
        {/* Left Arrow Button */}
        {showLeftBtn && (
          <button 
            className="scroll-btn left glassmorphism" 
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <span>‹</span>
          </button>
        )}

        {/* The Horizontal Scrollable Track */}
        <div className="slider-track" ref={sliderRef}>
          {movies.map((movie, index) => (
            <div className="slider-item" key={`${movie.subjectId}-${index}`}>
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>

        {/* Right Arrow Button */}
        {showRightBtn && (
          <button 
            className="scroll-btn right glassmorphism" 
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <span>›</span>
          </button>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .slider-container {
          margin-bottom: var(--spacing-xxl);
          position: relative;
        }

        .slider-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-md);
          padding: 0 var(--spacing-lg);
        }

        .slider-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text-main);
          letter-spacing: -0.3px;
          position: relative;
        }

        .show-more-link {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-primary);
          transition: color 0.2s ease, transform 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .show-more-link:hover {
          color: var(--color-primary-hover);
          transform: translateX(2px);
        }

        .slider-title::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 32px;
          height: 2px;
          background-color: var(--color-primary);
          border-radius: 2px;
        }

        .slider-relative-wrapper {
          position: relative;
          width: 100%;
        }

        .slider-track {
          display: flex;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-behavior: smooth;
          gap: var(--spacing-md);
          padding: var(--spacing-xs) var(--spacing-lg) var(--spacing-md) var(--spacing-lg);
          scrollbar-width: none; /* Hide scrollbars */
        }

        .slider-track::-webkit-scrollbar {
          display: none; /* Hide scrollbars Chrome */
        }

        .slider-item {
          flex: 0 0 170px; /* Refined uniform size for cards */
          scroll-snap-align: start;
        }

        /* Scroll Buttons */
        .scroll-btn {
          position: absolute;
          top: calc(50% - 24px - 16px); /* Centers button vertically relative to poster container */
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          font-size: 28px;
          font-weight: 300;
          color: var(--color-text-main);
          box-shadow: var(--shadow-low);
          transition: transform 0.2s ease, background-color 0.2s ease;
        }

        .scroll-btn:hover {
          background-color: var(--color-primary);
          border-color: var(--color-primary);
          transform: scale(1.1);
        }

        .scroll-btn.left {
          left: 10px;
        }

        .scroll-btn.right {
          right: 10px;
        }

        .scroll-btn span {
          display: block;
          line-height: 1;
          margin-top: -4px; /* Align arrow vertically */
        }

        .scroll-btn.left span {
          margin-right: 2px;
        }

        .scroll-btn.right span {
          margin-left: 2px;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .slider-item {
            flex: 0 0 150px; /* Smaller card size on mobile */
          }
          
          .scroll-btn {
            display: none; /* Hide arrows on touch screens */
          }
        }

        @media (max-width: 480px) {
          .slider-item {
            flex: 0 0 130px;
          }
          .slider-track {
            gap: var(--spacing-sm);
            padding: var(--spacing-xs) var(--spacing-md) var(--spacing-sm) var(--spacing-md);
          }
          .slider-header {
            padding: 0 var(--spacing-md);
          }
        }
      ` }} />
    </div>
  );
}
