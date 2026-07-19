'use client';

import { useState, useEffect } from 'react';
import { db } from '@/utils/db';
import MovieCard from '@/components/MovieCard';
import Modal from '@/components/Modal';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('Semua');

  // Modal notification state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', type: 'info', onConfirm: null });

  const showModal = (title, message, type = 'info', onConfirm = null) => {
    setModalConfig({ title, message, type, onConfirm });
    setModalOpen(true);
  };

  // Load bookmarks on mount
  useEffect(() => {
    const data = db.getBookmarksData();
    setBookmarks(data.bookmarks || []);
    setCategories(['Semua', ...(data.categories || [])]);
  }, []);

  const handleDeleteCategory = (catToDelete) => {
    if (catToDelete === 'Semua' || catToDelete === 'Favorit' || catToDelete === 'Tonton Nanti') {
      showModal('Peringatan', 'Kategori bawaan tidak dapat dihapus.', 'error');
      return;
    }

    showModal(
      'Hapus Kategori',
      `Apakah Anda yakin ingin menghapus kategori "${catToDelete}"? Semua film di dalamnya juga akan terhapus.`,
      'confirm',
      () => {
        const data = db.removeCategory(catToDelete);
        setBookmarks(data.bookmarks);
        setCategories(['Semua', ...data.categories]);
        setActiveTab('Semua');
      }
    );
  };

  // Filter bookmarks based on active tab
  const filteredBookmarks = activeTab === 'Semua'
    ? bookmarks
    : bookmarks.filter(b => b.category === activeTab);

  return (
    <div className="bookmarks-container container fadeIn">
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={modalConfig.title} 
        message={modalConfig.message} 
        type={modalConfig.type} 
        onConfirm={modalConfig.onConfirm} 
      />
      <h1 className="page-title">Koleksi Bookmark</h1>

      {/* Category Tabs */}
      <div className="category-tabs">
        {categories.map((cat, idx) => (
          <div 
            key={idx} 
            className={`tab-wrapper ${activeTab === cat ? 'active' : ''}`}
          >
            <button 
              className="tab-btn"
              onClick={() => setActiveTab(cat)}
            >
              {cat === 'Semua' ? '📂 Semua' : `📁 ${cat}`}
            </button>
            {cat !== 'Semua' && cat !== 'Favorit' && cat !== 'Tonton Nanti' && (
              <button 
                className="delete-tab-btn"
                onClick={() => handleDeleteCategory(cat)}
                title="Hapus Kategori"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Bookmarks list */}
      {filteredBookmarks.length > 0 ? (
        <div className="results-grid">
          {filteredBookmarks.map((movie) => (
            <div className="bookmark-card-container" key={movie.id}>
              {/* Reuse MovieCard but map properly to format matching API search responses */}
              <MovieCard 
                movie={{
                  subjectId: movie.id,
                  title: movie.title,
                  cover: movie.cover,
                  subjectType: movie.type === 'TvSeries' ? 2 : 1,
                  detailPath: movie.detailPath
                }} 
              />
              <button 
                className="remove-bookmark-btn glassmorphism"
                onClick={() => {
                  const updated = db.removeBookmark(movie.id);
                  setBookmarks(updated.bookmarks);
                }}
                title="Hapus dari Bookmark"
              >
                🗑️ Hapus
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">📂</span>
          <h3>Koleksi Kosong</h3>
          <p>Belum ada film atau serial TV di kategori "{activeTab}".</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .bookmarks-container {
          padding-top: 88px;
        }
 
        .page-title {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: var(--spacing-lg);
          letter-spacing: -0.5px;
        }
 
        /* Tabs Row */
        .category-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
          margin-bottom: var(--spacing-xl);
          border-bottom: 1px solid var(--color-border);
          padding-bottom: var(--spacing-sm);
        }
 
        .tab-wrapper {
          display: flex;
          align-items: center;
          background-color: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s ease;
        }
 
        .tab-wrapper:hover {
          background-color: var(--color-surface-hover);
        }
 
        .tab-wrapper.active {
          background-color: var(--color-primary);
          border-color: var(--color-primary);
        }
 
        .tab-btn {
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-muted);
          transition: color 0.2s ease;
        }
 
        .tab-wrapper.active .tab-btn {
          color: #000000;
        }

        .delete-tab-btn {
          padding: 8px 10px;
          font-size: 10px;
          color: rgba(255,255,255,0.4);
          border-left: 1px solid var(--color-border);
          transition: color 0.2s ease, background-color 0.2s ease;
        }

        .delete-tab-btn:hover {
          color: #ef4444;
          background-color: rgba(239, 68, 68, 0.1);
        }

        /* Bookmark Grid */
        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          gap: var(--spacing-lg);
        }

        .bookmark-card-container {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .remove-bookmark-btn {
          width: 100%;
          text-align: center;
          padding: var(--spacing-xs);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-muted);
          transition: all 0.2s ease;
        }

        .remove-bookmark-btn:hover {
          color: #ef4444;
          background-color: rgba(239, 68, 68, 0.1);
          border-color: #ef4444;
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
