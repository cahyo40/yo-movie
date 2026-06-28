'use client';

import { useState, useEffect } from 'react';
import { db } from '@/utils/db';
import MovieCard from '@/components/MovieCard';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(db.getHistory());
  }, []);

  const handleRemoveItem = (id) => {
    const updated = db.removeFromHistory(id);
    setHistory(updated);
  };

  const handleClearAll = () => {
    if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat menonton? Tindakan ini tidak dapat dibatalkan.')) {
      const updated = db.clearHistory();
      setHistory(updated);
    }
  };

  // Helper to format date
  const formatDate = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="history-container container fadeIn">
      <div className="history-header">
        <h1 className="page-title">Riwayat Menonton</h1>
        {history.length > 0 && (
          <button 
            className="btn btn-secondary glassmorphism clear-all-btn"
            onClick={handleClearAll}
          >
            🗑️ Hapus Semua Riwayat
          </button>
        )}
      </div>

      {history.length > 0 ? (
        <div className="results-grid">
          {history.map((item) => (
            <div className="history-card-container" key={item.id}>
              {/* Card info */}
              <div className="history-card-main">
                <MovieCard 
                  movie={{
                    subjectId: item.id,
                    title: item.title,
                    cover: item.cover,
                    subjectType: item.type === 'TvSeries' ? 2 : 1,
                    detailPath: item.detailPath
                  }} 
                />
              </div>
              <div className="history-card-footer">
                <p className="history-date">{formatDate(item.timestamp)}</p>
                <button 
                  className="remove-item-btn"
                  onClick={() => handleRemoveItem(item.id)}
                  title="Hapus dari Riwayat"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">⏳</span>
          <h3>Belum Ada Riwayat</h3>
          <p>Film atau serial TV yang Anda buka/tonton akan muncul di sini untuk memudahkan akses kembali.</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .history-container {
          padding-top: 88px;
        }

        .history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-lg);
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }

        .page-title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .clear-all-btn {
          font-size: 13px;
          padding: 8px 16px;
          transition: all 0.2s ease;
        }

        .clear-all-btn:hover {
          color: #ef4444;
          border-color: #ef4444;
          background-color: rgba(239, 68, 68, 0.05);
        }

        /* Results Grid */
        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          gap: var(--spacing-lg);
        }

        .history-card-container {
          display: flex;
          flex-direction: column;
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          overflow: hidden;
          padding: var(--spacing-xs);
        }

        .history-card-main {
          flex-grow: 1;
        }

        .history-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: var(--spacing-xs);
          border-top: 1px solid var(--color-border);
          margin-top: var(--spacing-xs);
        }

        .history-date {
          font-size: 10px;
          color: var(--color-text-muted);
          font-weight: 500;
        }

        .remove-item-btn {
          font-size: 12px;
          color: var(--color-text-muted);
          padding: 2px 6px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .remove-item-btn:hover {
          color: #ef4444;
          background-color: rgba(239, 68, 68, 0.1);
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
          max-width: 350px;
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
