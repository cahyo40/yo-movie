'use client';

import { useState, useEffect } from 'react';
import { db } from '@/utils/db';

export default function SettingsPage() {
  const [stats, setStats] = useState({
    bookmarksCount: 0,
    categoriesCount: 0,
    historyCount: 0,
    resumeCount: 0
  });

  const [importStatus, setImportStatus] = useState({ type: '', message: '' });

  // Load statistics on mount
  const loadStats = () => {
    const bookmarksData = db.getBookmarksData();
    const historyData = db.getHistory();
    const resumeData = db.getResumeList();

    setStats({
      bookmarksCount: bookmarksData.bookmarks?.length || 0,
      categoriesCount: bookmarksData.categories?.length || 0,
      historyCount: historyData?.length || 0,
      resumeCount: Object.keys(resumeData || {}).length || 0
    });
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Export data handler
  const handleExport = () => {
    try {
      const dataStr = db.exportData();
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      
      const date = new Date().toISOString().split('T')[0];
      link.download = `yomovie-data-backup-${date}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Gagal mengekspor data: ' + e.message);
    }
  };

  // Import data handler
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const jsonText = event.target.result;
      const res = db.importData(jsonText);
      
      if (res.success) {
        setImportStatus({
          type: 'success',
          message: 'Data berhasil diimpor! Memuat ulang statistik...'
        });
        loadStats();
        // Clear input value
        e.target.value = '';
      } else {
        setImportStatus({
          type: 'error',
          message: 'Gagal mengimpor data: ' + res.error
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="settings-container container fadeIn">
      <h1 className="page-title">Pengaturan Aplikasi</h1>

      {/* Info Card */}
      <section className="settings-section glassmorphism desc-card">
        <h3>📂 Penyimpanan Lokal (LocalStorage)</h3>
        <p>
          Aplikasi ini dirancang sepenuhnya untuk **penggunaan pribadi**. Seluruh data seperti daftar bookmark, 
          kategori, riwayat tontonan, dan progres terakhir pemutaran video disimpan sepenuhnya di dalam browser 
          Anda menggunakan fitur LocalStorage. 
        </p>
        <p style={{ marginTop: '10px' }}>
          Gunakan panel di bawah untuk mencadangkan data Anda secara berkala, atau memindahkannya ke browser/perangkat lain secara manual.
        </p>
      </section>

      {/* Statistics */}
      <section className="settings-section glassmorphism">
        <h3 className="section-title">📊 Statistik Data Anda</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.bookmarksCount}</span>
            <span className="stat-label">Bookmark</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.categoriesCount}</span>
            <span className="stat-label">Kategori</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.historyCount}</span>
            <span className="stat-label">Riwayat</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.resumeCount}</span>
            <span className="stat-label">Progres Lanjut Putar</span>
          </div>
        </div>
      </section>

      {/* Import / Export Panel */}
      <section className="settings-section glassmorphism">
        <h3 className="section-title">🔄 Cadangkan & Sinkronisasi</h3>
        
        <div className="action-row">
          {/* Export Panel */}
          <div className="action-card">
            <h4>Ekspor Data</h4>
            <p>Unduh seluruh data lokal Anda dalam format berkas JSON untuk disimpan sebagai cadangan.</p>
            <button className="btn btn-primary export-btn" onClick={handleExport}>
              📥 Ekspor ke JSON
            </button>
          </div>

          {/* Import Panel */}
          <div className="action-card">
            <h4>Impor Data</h4>
            <p>Unggah kembali berkas JSON cadangan Anda untuk memulihkan seluruh riwayat dan bookmark.</p>
            
            <label className="btn btn-secondary glassmorphism import-label">
              📤 Pilih File JSON
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImport}
                className="import-input"
              />
            </label>
          </div>
        </div>

        {/* Import Feedback */}
        {importStatus.message && (
          <div className={`import-feedback-box ${importStatus.type}`}>
            {importStatus.type === 'success' ? '✅' : '❌'} {importStatus.message}
          </div>
        )}
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        .settings-container {
          padding-top: 88px;
          max-width: 800px;
        }

        .page-title {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: var(--spacing-lg);
          letter-spacing: -0.5px;
        }

        .settings-section {
          padding: var(--spacing-lg);
          border-radius: 12px;
          margin-bottom: var(--spacing-lg);
        }

        .desc-card h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--color-primary-hover);
          margin-bottom: var(--spacing-xs);
        }

        .desc-card p {
          font-size: 14px;
          color: var(--color-text-muted);
          line-height: 1.6;
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: var(--spacing-md);
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--spacing-md);
        }

        .stat-card {
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 800;
          color: var(--color-primary-hover);
          line-height: 1;
          margin-bottom: var(--spacing-xxs);
        }

        .stat-label {
          font-size: 11px;
          color: var(--color-text-muted);
          font-weight: 600;
        }

        /* Action Panels */
        .action-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-lg);
        }

        .action-card {
          background-color: rgba(255,255,255,0.02);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
        }

        .action-card h4 {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: var(--spacing-xxs);
        }

        .action-card p {
          font-size: 12px;
          color: var(--color-text-muted);
          line-height: 1.4;
          margin-bottom: var(--spacing-lg);
          flex-grow: 1;
        }

        .export-btn {
          width: 100%;
        }

        .import-label {
          width: 100%;
          cursor: pointer;
          font-size: 14px;
        }

        .import-input {
          display: none;
        }

        /* Feedback box */
        .import-feedback-box {
          margin-top: var(--spacing-md);
          padding: var(--spacing-sm);
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
        }

        .import-feedback-box.success {
          background-color: rgba(34, 197, 94, 0.1);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .import-feedback-box.error {
          background-color: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        /* Responsive */
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .action-row {
            grid-template-columns: 1fr;
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
