'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import MovieSlider from '@/components/MovieSlider';
import VideoPlayer from '@/components/VideoPlayer';
import { db } from '@/utils/db';

export default function DetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [mediaData, setMediaData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  
  // Bookmark state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkCategory, setBookmarkCategory] = useState('');
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');

  // TV Series specific state
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [episodesMap, setEpisodesMap] = useState({}); // seasonNum -> episodes array

  // Video Player state
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerArgs, setPlayerArgs] = useState(null);
  const [loadingLinks, setLoadingLinks] = useState(false);
  
  // Resume state
  const [resumeProgress, setResumeProgress] = useState(null);

  // 1. Fetch details on mount
  useEffect(() => {
    if (!id) return;
    
    async function fetchDetails() {
      setLoading(true);
      try {
        const res = await fetch(`/api/detail?id=${id}`);
        if (!res.ok) throw new Error('Failed to fetch details');
        const json = await res.json();
        
        const detail = json.detail;
        setMediaData(detail);
        setRecommendations(json.recommendations || []);

        // Process Seasons & Episodes if TV Series
        if (detail?.resource?.seasons) {
          const seasons = detail.resource.seasons;
          const map = {};
          seasons.forEach((seasonObj) => {
            const seasonNum = seasonObj.se;
            const maxEp = seasonObj.maxEp || 1;
            const allEpStr = seasonObj.allEp;
            
            let episodes = [];
            if (allEpStr) {
              episodes = allEpStr.split(',').map(e => parseInt(e.trim())).filter(e => !isNaN(e));
            } else {
              for (let i = 1; i <= maxEp; i++) {
                episodes.push(i);
              }
            }
            map[seasonNum] = episodes;
          });

          setEpisodesMap(map);
          // Default to first season
          if (seasons.length > 0) {
            setSelectedSeason(seasons[0].se);
          }
        }
      } catch (err) {
        console.error('[Detail] Error loading detail:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
    
    // Check resume progress for this media
    const progress = db.getResume(id);
    if (progress) {
      setResumeProgress(progress);
    }

    // Load bookmarks state
    const bookmarkData = db.getBookmarksData();
    const found = bookmarkData.bookmarks.find(b => b.id === id);
    if (found) {
      setIsBookmarked(true);
      setBookmarkCategory(found.category);
    }
    setCategories(bookmarkData.categories);
  }, [id]);

  // Autoplay if play=true is passed in URL query parameters
  useEffect(() => {
    if (mediaData && searchParams.get('play') === 'true') {
      const playSeason = parseInt(searchParams.get('season') || '0', 10);
      const playEpisode = parseInt(searchParams.get('episode') || '0', 10);
      playMedia(playSeason, playEpisode);
    }
  }, [mediaData, searchParams]);

  // 2. Play video logic
  const playMedia = async (seasonNum = 0, episodeNum = 0) => {
    if (!mediaData) return;
    
    setLoadingLinks(true);
    const detailPath = mediaData.subject?.detailPath || '';
    
    try {
      const res = await fetch(`/api/play?id=${id}&season=${seasonNum}&episode=${episodeNum}&detailPath=${encodeURIComponent(detailPath)}`);
      if (!res.ok) throw new Error('Gagal memuat link video');
      const json = await res.json();
      
      if (!json.streams || json.streams.length === 0) {
        alert('Maaf, tidak ada tautan video yang tersedia saat ini.');
        return;
      }

      // Add to watch history
      db.addToHistory({
        id,
        title: mediaData.subject?.title,
        cover: mediaData.subject?.cover?.url || mediaData.subject?.cover,
        type: mediaData.subject?.subjectType === 2 ? 'TvSeries' : 'Movie',
        detailPath
      });

      // Launch Player
      setPlayerArgs({
        mediaId: id,
        streams: json.streams,
        captions: json.captions,
        title: mediaData.subject?.title,
        cover: mediaData.subject?.cover?.url || mediaData.subject?.cover,
        type: mediaData.subject?.subjectType === 2 ? 'TvSeries' : 'Movie',
        detailPath,
        season: seasonNum,
        episode: episodeNum
      });
      setShowPlayer(true);
    } catch (err) {
      console.error('[Detail] Error playing media:', err);
      alert('Terjadi kesalahan saat memproses streaming video: ' + err.message);
    } finally {
      setLoadingLinks(false);
    }
  };

  // 3. Bookmark actions
  const toggleBookmark = () => {
    if (isBookmarked) {
      db.removeBookmark(id);
      setIsBookmarked(false);
      setBookmarkCategory('');
    } else {
      setShowBookmarkModal(true);
    }
  };

  const saveBookmark = (category) => {
    if (!mediaData) return;
    db.addBookmark({
      id,
      title: mediaData.subject?.title,
      cover: mediaData.subject?.cover?.url || mediaData.subject?.cover,
      type: mediaData.subject?.subjectType === 2 ? 'TvSeries' : 'Movie',
      detailPath: mediaData.subject?.detailPath || ''
    }, category);
    setIsBookmarked(true);
    setBookmarkCategory(category);
    setShowBookmarkModal(false);
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (trimmed) {
      db.addCategory(trimmed);
      setCategories(prev => [...prev, trimmed]);
      setNewCatName('');
    }
  };

  if (loading) {
    return (
      <div className="detail-loading container fadeIn">
        <div className="detail-loading-layout">
          <div className="loading-poster skeleton"></div>
          <div className="loading-details">
            <div className="loading-title skeleton"></div>
            <div className="loading-meta skeleton"></div>
            <div className="loading-desc skeleton"></div>
            <div className="loading-btn skeleton"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!mediaData || !mediaData.subject) {
    return (
      <div className="empty-state container fadeIn">
        <span className="empty-icon">⚠️</span>
        <h3>Konten Tidak Ditemukan</h3>
        <p>Maaf, detail film atau serial TV ini gagal dimuat.</p>
        <button className="btn btn-primary" onClick={() => router.push('/')}>
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const subject = mediaData.subject;
  const isTv = subject.subjectType === 2;
  const rating = subject.imdbRatingValue;
  const year = subject.releaseDate ? subject.releaseDate.split('-')[0] : '';
  const tags = subject.genre ? subject.genre.split(',').map(t => t.trim()) : [];
  const actors = mediaData.stars || [];

  return (
    <div className="detail-container fadeIn">
      {/* Loading Overlay */}
      {loadingLinks && (
        <div className="loading-overlay glassmorphism">
          <div className="player-spinner"></div>
          <p>Mendapatkan Tautan Streaming & Subtitle...</p>
        </div>
      )}

      {/* Fullscreen Video Player */}
      {showPlayer && playerArgs && (() => {
        // Calculate if next episode exists
        const getNextEpisode = (currentSeason, currentEpisode) => {
          if (!mediaData || !mediaData.resource?.seasons) return null;
          const seasons = mediaData.resource.seasons;
          
          // 1. Get episode list for current season
          const currentSeasonEps = episodesMap[currentSeason] || [];
          const currentIndex = currentSeasonEps.indexOf(currentEpisode);
          
          if (currentIndex !== -1 && currentIndex < currentSeasonEps.length - 1) {
            return {
              season: currentSeason,
              episode: currentSeasonEps[currentIndex + 1]
            };
          }
          
          // 2. If last episode of the season, try next season
          const currentSeasonIndex = seasons.findIndex(s => s.se === currentSeason);
          if (currentSeasonIndex !== -1 && currentSeasonIndex < seasons.length - 1) {
            const nextSeasonNum = seasons[currentSeasonIndex + 1].se;
            const nextSeasonEps = episodesMap[nextSeasonNum] || [];
            if (nextSeasonEps.length > 0) {
              return {
                season: nextSeasonNum,
                episode: nextSeasonEps[0]
              };
            }
          }
          
          return null;
        };

        const nextEp = getNextEpisode(playerArgs.season, playerArgs.episode);

        return (
          <VideoPlayer
            {...playerArgs}
            onNextEpisode={nextEp ? () => playMedia(nextEp.season, nextEp.episode) : null}
            onClose={() => {
              setShowPlayer(false);
              setPlayerArgs(null);
              // Refresh resume progress
              const progress = db.getResume(id);
              setResumeProgress(progress);
            }}
          />
        );
      })()}

      {/* Detail Layout */}
      <div className="detail-layout">
        {/* Landscape Banner Background Blur */}
        <div 
          className="detail-backdrop"
          style={{ backgroundImage: `linear-gradient(to bottom, rgba(9, 9, 11, 0.4) 0%, var(--color-background) 95%), url(${subject.cover?.url || subject.cover})` }}
        ></div>

        {/* Content Panel */}
        <div className="detail-content container">
          <div className="detail-grid">
            {/* Poster Card */}
            <div className="detail-poster-wrapper">
              <img 
                src={subject.cover?.url || subject.cover} 
                alt={subject.title} 
                className="detail-poster"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&auto=format&fit=crop'; }}
              />
            </div>

            {/* Movie Info */}
            <div className="detail-info-wrapper">
              <h1 className="detail-title">{subject.title}</h1>
              
              <div className="detail-meta">
                {rating && <span className="meta-rating">⭐ {parseFloat(rating).toFixed(1)}</span>}
                {year && <span className="meta-year">{year}</span>}
                <span className="meta-type">{isTv ? 'Serial TV' : 'Film'}</span>
                {subject.countryName && <span className="meta-country">{subject.countryName}</span>}
              </div>

              {/* Genre Tags */}
              <div className="detail-genres">
                {tags.map((tag, idx) => (
                  <span key={idx} className="genre-tag">{tag}</span>
                ))}
              </div>

              <p className="detail-desc">{subject.description || 'Tidak ada deskripsi yang tersedia.'}</p>

              {/* Action Buttons */}
              <div className="detail-actions">
                {isTv ? (
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      // Play first episode of first season
                      const seasons = mediaData.resource?.seasons || [];
                      if (seasons.length > 0) {
                        const s = seasons[0].se;
                        const eps = episodesMap[s] || [1];
                        playMedia(s, eps[0]);
                      } else {
                        playMedia(1, 1);
                      }
                    }}
                  >
                    ▶ Putar Serial
                  </button>
                ) : (
                  <>
                    {resumeProgress ? (
                      <>
                        <button className="btn btn-primary" onClick={() => playMedia(0, 0)}>
                          ▶ Lanjut Tonton ({Math.round(resumeProgress.percentage)}%)
                        </button>
                        <button className="btn btn-secondary glassmorphism" onClick={() => {
                          db.clearResume(id);
                          playMedia(0, 0);
                        }}>
                          🔄 Putar Ulang
                        </button>
                      </>
                    ) : (
                      <button className="btn btn-primary" onClick={() => playMedia(0, 0)}>
                        ▶ Putar Sekarang
                      </button>
                    )}
                  </>
                )}

                <button 
                  className={`btn btn-secondary glassmorphism bookmark-btn ${isBookmarked ? 'active' : ''}`}
                  onClick={toggleBookmark}
                >
                  🔖 {isBookmarked ? `Tersimpan di: ${bookmarkCategory}` : 'Tambah ke Bookmark'}
                </button>
              </div>

              {/* Actor/Stars Info */}
              {actors.length > 0 && (
                <div className="actors-section">
                  <h3 className="sub-section-title">Pemeran Utama</h3>
                  <div className="actors-grid">
                    {actors.slice(0, 6).map((actor, idx) => (
                      <div className="actor-card glassmorphism" key={idx}>
                        {actor.avatarUrl ? (
                          <img src={actor.avatarUrl} alt={actor.name} className="actor-avatar" />
                        ) : (
                          <div className="actor-avatar-placeholder">👤</div>
                        )}
                        <div className="actor-info">
                          <p className="actor-name" title={actor.name}>{actor.name}</p>
                          {actor.character && <p className="actor-role" title={actor.character}>{actor.character}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TV Series Season & Episode Selector */}
      {isTv && mediaData.resource?.seasons && (
        <section className="episodes-section container">
          <h2 className="section-title">Daftar Episode</h2>
          
          {/* Season Tabs */}
          <div className="season-tabs">
            {mediaData.resource.seasons.map((seasonObj) => (
              <button
                key={seasonObj.se}
                className={`season-tab ${selectedSeason === seasonObj.se ? 'active' : ''}`}
                onClick={() => setSelectedSeason(seasonObj.se)}
              >
                Season {seasonObj.se}
              </button>
            ))}
          </div>

          {/* Episode Grid List */}
          {selectedSeason && episodesMap[selectedSeason] && (
            <div className="episodes-grid">
              {episodesMap[selectedSeason].map((ep) => {
                // Find if there is resume progress for this episode
                const epKey = `${id}_s${selectedSeason}_e${ep}`; // custom composite progress key or check sub-progress
                const resumeList = db.getResumeList();
                const epProgress = Object.values(resumeList).find(
                  r => r.title === subject.title && r.season === selectedSeason && r.episode === ep
                );

                return (
                  <button 
                    key={ep} 
                    className="episode-card glassmorphism"
                    onClick={() => playMedia(selectedSeason, ep)}
                  >
                    <span className="ep-num">Eps {ep}</span>
                    <span className="ep-play-icon">▶</span>
                    {epProgress && epProgress.percentage > 0 && (
                      <div className="ep-progress-container">
                        <div className="ep-progress-bar" style={{ width: `${epProgress.percentage}%` }}></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="recoms-section">
          <MovieSlider title="Rekomendasi Terkait" movies={recommendations} />
        </section>
      )}

      {/* Bookmark Modal */}
      {showBookmarkModal && (
        <div className="modal-backdrop fadeIn" onClick={() => setShowBookmarkModal(false)}>
          <div className="modal-card glassmorphism" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Pilih Kategori Bookmark</h3>
              <button className="close-modal" onClick={() => setShowBookmarkModal(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              {/* Category Options */}
              <div className="category-options-list">
                {categories.map((cat, idx) => (
                  <button 
                    key={idx} 
                    className="category-opt-btn"
                    onClick={() => saveBookmark(cat)}
                  >
                    📂 {cat}
                  </button>
                ))}
              </div>

              {/* Create Category Form */}
              <form onSubmit={handleCreateCategory} className="create-cat-form">
                <input 
                  type="text" 
                  placeholder="Kategori Baru..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="create-cat-input"
                  required
                />
                <button type="submit" className="btn btn-primary create-cat-btn">
                  Tambah
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .detail-container {
          position: relative;
          min-height: 100vh;
        }

        .detail-loading {
          padding-top: 100px;
        }

        .detail-loading-layout {
          display: flex;
          gap: var(--spacing-xxl);
        }

        .loading-poster {
          width: 300px;
          aspect-ratio: 2 / 3;
        }

        .loading-details {
          flex-grow: 1;
        }

        .loading-title {
          width: 250px;
          height: 36px;
          margin-bottom: var(--spacing-md);
        }

        .loading-meta {
          width: 180px;
          height: 20px;
          margin-bottom: var(--spacing-lg);
        }

        .loading-desc {
          width: 100%;
          height: 120px;
          margin-bottom: var(--spacing-xl);
        }

        .loading-btn {
          width: 150px;
          height: 48px;
        }

        /* Backdrop banner blur */
        .detail-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 400px;
          background-size: cover;
          background-position: center 30%;
          filter: blur(4px);
          opacity: 0.15;
          z-index: 1;
          pointer-events: none;
        }

        .detail-content {
          position: relative;
          z-index: 2;
          padding-top: 90px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: var(--spacing-xxl);
          align-items: start;
        }

        .detail-poster-wrapper {
          width: 100%;
          aspect-ratio: 2 / 3;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: var(--shadow-high);
          background-color: var(--color-surface);
        }

        .detail-poster {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .detail-info-wrapper {
          color: var(--color-text-main);
        }

        .detail-title {
          font-size: clamp(28px, 4vw, 42px);
          font-weight: 800;
          letter-spacing: -1px;
          line-height: 1.1;
          margin-bottom: var(--spacing-sm);
        }

        .detail-meta {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-md);
          font-size: 14px;
          color: var(--color-text-muted);
          font-weight: 600;
          margin-bottom: var(--spacing-md);
          align-items: center;
        }

        .meta-rating {
          color: var(--color-rating);
          background-color: rgba(234, 179, 8, 0.1);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .detail-genres {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
          margin-bottom: var(--spacing-lg);
        }

        .genre-tag {
          font-size: 11px;
          font-weight: 700;
          background-color: var(--color-surface-hover);
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
        }

        .detail-desc {
          font-size: 15px;
          line-height: 1.6;
          color: var(--color-text-muted);
          margin-bottom: var(--spacing-xl);
        }

        .detail-actions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xxl);
        }

        .bookmark-btn.active {
          border-color: var(--color-primary);
          background-color: rgba(99, 102, 241, 0.1);
          color: var(--color-primary-hover);
        }

        /* Actors grid */
        .actors-section {
          border-top: 1px solid var(--color-border);
          padding-top: var(--spacing-lg);
        }

        .sub-section-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: var(--spacing-md);
        }

        .actors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--spacing-md);
        }

        .actor-card {
          display: flex;
          align-items: center;
          padding: var(--spacing-xs);
          border-radius: 8px;
          gap: var(--spacing-sm);
        }

        .actor-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          background-color: var(--color-surface-hover);
        }

        .actor-avatar-placeholder {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-surface-hover);
          font-size: 20px;
          flex-shrink: 0;
        }

        .actor-info {
          min-width: 0;
        }

        .actor-name {
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .actor-role {
          font-size: 11px;
          color: var(--color-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Episodes section */
        .episodes-section {
          padding-top: var(--spacing-xl);
          margin-bottom: var(--spacing-xl);
        }

        .season-tabs {
          display: flex;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-lg);
          border-bottom: 1px solid var(--color-border);
          padding-bottom: var(--spacing-xs);
          overflow-x: auto;
        }

        .season-tab {
          font-size: 14px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 8px;
          color: var(--color-text-muted);
          transition: all 0.2s ease;
        }

        .season-tab.active {
          color: #000000;
          background-color: var(--color-primary);
        }

        .episodes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: var(--spacing-md);
        }

        .episode-card {
          position: relative;
          aspect-ratio: 1.5 / 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          border-radius: 8px;
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .episode-card:hover {
          background-color: var(--color-primary);
          border-color: var(--color-primary);
          color: #000000;
        }

        .ep-play-icon {
          font-size: 10px;
          margin-top: 4px;
          opacity: 0.7;
        }

        .ep-progress-container {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background-color: rgba(255,255,255,0.15);
        }

        .ep-progress-bar {
          height: 100%;
          background-color: var(--color-primary);
        }

        /* Loading link overlay */
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(9,9,11,0.9);
          z-index: 9998;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-md);
          color: white;
          font-weight: 600;
        }

        /* Bookmark Modal */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0,0,0,0.6);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-card {
          width: 90%;
          max-width: 400px;
          border-radius: 16px;
          padding: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-header h3 {
          font-size: 16px;
          font-weight: 700;
        }

        .close-modal {
          font-size: 16px;
          color: var(--color-text-muted);
        }

        .close-modal:hover {
          color: white;
        }

        .category-options-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          max-height: 180px;
          overflow-y: auto;
          margin-bottom: var(--spacing-sm);
        }

        .category-opt-btn {
          width: 100%;
          text-align: left;
          padding: var(--spacing-sm);
          border-radius: 8px;
          background-color: rgba(255,255,255,0.05);
          font-weight: 600;
          font-size: 14px;
          transition: background-color 0.2s ease;
        }

        .category-opt-btn:hover {
          background-color: var(--color-primary);
          color: #000000;
        }

        .create-cat-form {
          display: flex;
          gap: var(--spacing-xs);
          border-top: 1px solid var(--color-border);
          padding-top: var(--spacing-md);
        }

        .create-cat-input {
          flex-grow: 1;
          background-color: rgba(255,255,255,0.05);
          border: 1px solid var(--color-border);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
        }

        .create-cat-input:focus {
          border-color: var(--color-primary);
          outline: none;
        }

        .create-cat-btn {
          padding: 8px 16px;
          font-size: 13px;
        }

        /* Responsive details */
        @media (max-width: 768px) {
          .detail-grid {
            grid-template-columns: 1fr;
            gap: var(--spacing-lg);
          }
          
          .detail-poster-wrapper {
            max-width: 250px;
            margin: 0 auto;
          }
          
          .detail-title {
            text-align: center;
          }
          
          .detail-meta, .detail-genres {
            justify-content: center;
          }
          
          .detail-actions {
            justify-content: center;
          }
          
          .detail-content {
            padding-top: 20px;
          }
          
          .actors-grid {
            grid-template-columns: 1fr;
          }
          
          .loading-poster {
            display: none;
          }
        }
      ` }} />
    </div>
  );
}
