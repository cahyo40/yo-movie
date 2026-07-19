'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { db } from '@/utils/db';

export default function VideoPlayer({
  mediaId,
  streams = [],
  captions = [],
  title = '',
  cover = '',
  type = 'movie',
  detailPath = '',
  season = 0,
  episode = 0,
  onNextEpisode = null,
  onClose
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  
  const [currentStream, setCurrentStream] = useState(null);
  const [qualityMode, setQualityMode] = useState('auto');
  const [currentSubtitle, setCurrentSubtitle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errorCount, setErrorCount] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isBuffering, setIsBuffering] = useState(false);
  
  const controlsTimeoutRef = useRef(null);
  const lastSavedTimeRef = useRef(0);
  const isMountedRef = useRef(true);

  // Synchronize playback speed with video tag
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, currentStream, loading]);

  // Toggle player-open body class for full screen layout and prevent memory leaks
  useEffect(() => {
    isMountedRef.current = true;
    document.body.classList.add('player-open');
    return () => {
      isMountedRef.current = false;
      document.body.classList.remove('player-open');
    };
  }, []);

  // Bandwidth-based stream resolver for progressive streams
  const getAutoStream = (streamList) => {
    if (!streamList || streamList.length === 0) return null;

    // Check navigator connection speed (Network Information API)
    const conn = typeof navigator !== 'undefined' ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection) : null;
    let targetKeyword = '720P'; // default fallback to HD

    if (conn) {
      const downlink = conn.downlink || 5; // estimated Mbps
      const type = conn.effectiveType || '4g';

      if (type === 'slow-2g' || type === '2g' || downlink < 1.5) {
        targetKeyword = '360P';
      } else if (type === '3g' || downlink < 4.0) {
        targetKeyword = '480P';
      } else if (downlink >= 8.0) {
        targetKeyword = '1080P';
      }
    }

    // Try to find the exact match
    let match = streamList.find(s => s.resolutions?.toUpperCase().includes(targetKeyword));

    // Fallbacks if target quality is not available
    if (!match && targetKeyword === '1080P') {
      match = streamList.find(s => s.resolutions?.toUpperCase().includes('720P'));
    }
    if (!match) {
      match = streamList.find(s => s.resolutions?.toUpperCase().includes('720P'));
    }
    if (!match) {
      match = streamList.find(s => s.resolutions?.toUpperCase().includes('480P'));
    }
    if (!match) {
      match = streamList.find(s => s.resolutions?.toUpperCase().includes('360P'));
    }

    return match || streamList[0];
  };

  // 1. Set initial stream and subtitle
  useEffect(() => {
    if (streams && streams.length > 0) {
      if (qualityMode === 'auto') {
        const autoStream = getAutoStream(streams);
        setCurrentStream(autoStream);
      } else {
        // Find if currentStream is still in streams, if not reset
        const exists = streams.some(s => s.url === currentStream?.url);
        if (!exists) {
          setCurrentStream(streams[0]);
          setQualityMode('manual');
        }
      }
    }
    
    // Find Indonesian or English subtitle by default
    if (captions && captions.length > 0) {
      const defaultSub = captions.find(sub => 
        sub.lanName?.toLowerCase().includes('indonesia') || 
        sub.lanName?.toLowerCase().includes('indo')
      ) || captions.find(sub => 
        sub.lanName?.toLowerCase().includes('english') || 
        sub.lanName?.toLowerCase().includes('eng')
      ) || captions[0];
      
      setCurrentSubtitle(defaultSub);
    }
  }, [streams, captions, qualityMode]);

  // 2. Initialize Hls.js or native playback on stream change
  useEffect(() => {
    if (!currentStream?.url || !videoRef.current) return;

    const video = videoRef.current;
    setLoading(true);

    // Clean up previous Hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = currentStream.url;
    const proxiedUrl = `/api/stream-proxy?url=${encodeURIComponent(streamUrl)}`;
    const isMp4 = streamUrl.toLowerCase().includes('.mp4') || !streamUrl.toLowerCase().includes('.m3u8');

    console.log('[YoMovie Player] Loading stream:', streamUrl, 'isMp4:', isMp4, 'proxiedUrl:', proxiedUrl);

    if (isMp4) {
      video.src = proxiedUrl;
      const handleLoadedMetadata = () => {
        setLoading(false);
        resumePlayback();
      };
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.src = '';
      };
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 15,
        maxBufferSize: 10 * 1024 * 1024, // 10MB max buffer size
        maxBufferLength: 5, // only buffer 5s initially to start faster
        lowLatencyMode: true,
        enableWorker: true,
        abrEwmaDefaultEstimate: 500000 // default to lower bitrate for instant start
      });
      hlsRef.current = hls;
      hls.loadSource(proxiedUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        // Try to resume progress
        resumePlayback();
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('[HLS] Network error, trying to recover...', data);
              hls.startLoad();
              handlePlaybackError();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('[HLS] Media error, trying to recover...', data);
              hls.recoverMediaError();
              break;
            default:
              console.error('[HLS] Unrecoverable error:', data);
              hls.destroy();
              handlePlaybackError();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      video.src = proxiedUrl;
      const handleLoadedMetadata = () => {
        setLoading(false);
        resumePlayback();
      };
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentStream]);

  // Self-healing playback recovery for expired signed stream links
  const handlePlaybackError = async () => {
    if (!isMountedRef.current) return;

    if (errorCount > 3) {
      console.error('[YoMovie Player] Fatal playback error: recovery attempts exhausted.');
      if (isMountedRef.current) {
        showToast('Gagal memulihkan video. Silakan muat ulang halaman.');
        setLoading(false);
      }
      return;
    }

    if (isMountedRef.current) {
      setErrorCount(prev => prev + 1);
      showToast('Koneksi terganggu. Mencoba menyegarkan tautan video...');
      setLoading(true);
    }

    try {
      const res = await fetch(`/api/play?id=${mediaId}&season=${season}&episode=${episode}&detailPath=${encodeURIComponent(detailPath)}`);
      if (!res.ok) throw new Error('Gagal memuat link video');
      const json = await res.json();
      
      if (!isMountedRef.current) return;

      if (json.streams && json.streams.length > 0) {
        const video = videoRef.current;
        const prevTime = video ? video.currentTime : currentTime;

        let newStream = null;
        if (qualityMode === 'auto') {
          newStream = getAutoStream(json.streams);
        } else {
          newStream = json.streams.find(s => s.resolutions === currentStream?.resolutions) || json.streams[0];
        }

        if (newStream && isMountedRef.current) {
          console.log('[YoMovie Player] Refreshed stream URL successfully:', newStream.url);
          setCurrentStream(newStream);
          
          // Seek back and resume play
          setTimeout(() => {
            if (videoRef.current && isMountedRef.current) {
              videoRef.current.currentTime = prevTime;
              videoRef.current.play().then(() => setPlaying(true)).catch(() => {});
            }
          }, 800);
        }
      } else {
        throw new Error('Link video kosong');
      }
    } catch (err) {
      console.error('[YoMovie Player] Recovery failed:', err);
      if (isMountedRef.current) {
        showToast('Gagal memulihkan video. Coba muat ulang halaman.');
        setLoading(false);
      }
    }
  };

  const handleNativeVideoError = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const error = video.error;
    console.error('[YoMovie Player] Native video player error:', error);

    // Ignore aborted errors (code 1) or when src is empty/not set/reset to location.href
    if (!error || error.code === 1 || !video.src || video.src === window.location.href) {
      return;
    }

    handlePlaybackError();
  };

  // 3. Resume playback helper
  const resumePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    const savedProgress = db.getResume(mediaId);
    // If it's a TV series, check if the season & episode matches the saved one
    const isSameEpisode = type !== 'TvSeries' || 
      (savedProgress && savedProgress.season === season && savedProgress.episode === episode);

    if (savedProgress && savedProgress.time > 5 && isSameEpisode) {
      // Don't seek if we are within 10 seconds of the end
      if (savedProgress.duration - savedProgress.time > 10) {
        video.currentTime = savedProgress.time;
        showToast(`Melanjutkan tontonan dari ${formatTime(savedProgress.time)}`);
      }
    }
    
    // Auto play
    video.play().then(() => setPlaying(true)).catch(() => {});
  };

  // 3b. Enable subtitle track programmatically
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentSubtitle) return;

    // Wait a bit for the track element to be added to DOM
    const timer = setTimeout(() => {
      const tracks = video.textTracks;
      if (tracks && tracks.length > 0) {
        for (let i = 0; i < tracks.length; i++) {
          tracks[i].mode = 'showing';
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [currentSubtitle, currentStream]);

  // 4. Save progress on timeupdate (throttled to 5s)
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const currentT = video.currentTime;
    const dur = video.duration || duration;

    setCurrentTime(currentT);
    if (video.duration) setDuration(video.duration);

    // Save every 5 seconds
    if (Math.abs(currentT - lastSavedTimeRef.current) > 5) {
      saveProgress(currentT, dur);
    }
  };

  const saveProgress = (time, dur) => {
    if (time <= 0 || dur <= 0) return;
    lastSavedTimeRef.current = time;
    db.saveResume(mediaId, {
      season,
      episode,
      time,
      duration: dur,
      title,
      cover,
      type,
      detailPath
    });
  };

  // Save progress on pause or unmount
  const handlePause = () => {
    setPlaying(false);
    if (videoRef.current) {
      saveProgress(videoRef.current.currentTime, videoRef.current.duration);
    }
  };

  const handlePlay = () => {
    setPlaying(true);
  };

  useEffect(() => {
    return () => {
      // Save progress on final unmount
      if (videoRef.current) {
        const video = videoRef.current;
        if (video.currentTime > 5 && video.duration > 0) {
          db.saveResume(mediaId, {
            season,
            episode,
            time: video.currentTime,
            duration: video.duration,
            title,
            cover,
            type,
            detailPath
          });
        }
      }
    };
  }, [mediaId, season, episode]);

  // Toast notification helper
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Controls auto-hide
  const triggerShowControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (playing) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    triggerShowControls();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [playing]);

  // Video Control Methods
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (playing) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skip = (seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime += seconds;
    triggerShowControls();
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const newVol = parseFloat(e.target.value);
    video.volume = newVol;
    setVolume(newVol);
    setMuted(newVol === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    const newMute = !muted;
    video.muted = newMute;
    setMuted(newMute);
    if (!newMute && volume === 0) {
      video.volume = 0.5;
      setVolume(0.5);
    }
  };

  const toggleFullscreen = () => {
    const container = document.getElementById('player-container');
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Time Formatter (e.g. 01:23:45)
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="player-overlay fadeIn" 
      id="player-container"
      onMouseMove={triggerShowControls}
      onClick={triggerShowControls}
    >
      {/* Toast Notification */}
      {toastMsg && <div className="player-toast glassmorphism">{toastMsg}</div>}

      {/* Loading Spinner */}
      {(loading || isBuffering) && (
        <div className="player-loader-container">
          <div className="player-spinner"></div>
          <p>{isBuffering ? 'Buffering...' : 'Memuat video...'}</p>
        </div>
      )}

      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        className="video-element"
        onTimeUpdate={handleTimeUpdate}
        onPause={handlePause}
        onPlay={handlePlay}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onSeeked={() => setIsBuffering(false)}
        onError={handleNativeVideoError}
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          const rect = e.target.getBoundingClientRect();
          const x = e.clientX - rect.left; //x position within the element.
          if (x < rect.width / 2) {
            skip(-10); // double click left: rewind 10s
          } else {
            skip(10); // double click right: forward 10s
          }
        }}
      >
        {/* Render Track Subtitle */}
        {currentSubtitle?.url && (
          <track
            key={currentSubtitle.url}
            src={`/api/subtitle-proxy?url=${encodeURIComponent(currentSubtitle.url)}`}
            kind="subtitles"
            srcLang={currentSubtitle.lan || 'id'}
            label={currentSubtitle.lanName || 'Subtitle'}
            default
          />
        )}
      </video>

      {/* Player Header controls (Back, Title) */}
      <div className={`player-header glassmorphism ${showControls ? 'visible' : ''}`}>
        <button className="back-btn" onClick={onClose}>
          ← Kembali
        </button>
        <div className="header-info">
          <h2 className="player-title">{title}</h2>
          {type === 'TvSeries' && (
            <p className="player-subtitle">Season {season} • Episode {episode}</p>
          )}
        </div>
      </div>

      {/* Player Controls Bar */}
      <div className={`player-controls-wrapper glassmorphism ${showControls ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Seekbar Slider */}
        <div className="seekbar-container">
          <span className="time-display">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="seekbar-input"
          />
          <span className="time-display">{formatTime(duration)}</span>
        </div>

        {/* Buttons Panel */}
        <div className="controls-panel">
          <div className="left-controls">
            {/* Play/Pause */}
            <button className="control-btn" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? '⏸' : '▶'}
            </button>

            {/* Rewind/Forward */}
            <button className="control-btn skip-btn" onClick={() => skip(-10)} title="Mundur 10s">
              ⏪
            </button>
            <button className="control-btn skip-btn" onClick={() => skip(10)} title="Maju 10s">
              ⏩
            </button>

            {/* Volume Control */}
            <div className="volume-container">
              <button className="control-btn" onClick={toggleMute} aria-label="Mute">
                {muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>
          </div>

          <div className="right-controls">
            {/* Speed Selector */}
            <div className="selector-container">
              <span className="selector-label">Kecepatan</span>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="player-select"
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">Normal</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>

            {/* Subtitle Selector */}
            {captions && captions.length > 0 && (
              <div className="selector-container">
                <span className="selector-label">CC</span>
                <select
                  value={currentSubtitle?.url || ''}
                  onChange={(e) => {
                    const selected = captions.find(sub => sub.url === e.target.value);
                    setCurrentSubtitle(selected || null);
                  }}
                  className="player-select"
                >
                  <option value="">Matikan Subtitle</option>
                  {captions.map((sub, idx) => (
                    <option key={idx} value={sub.url}>{sub.lanName || `Track ${idx + 1}`}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Quality Selector */}
            {streams && streams.length > 0 && (
              <div className="selector-container">
                <span className="selector-label">Resolusi</span>
                <select
                  value={qualityMode === 'auto' ? 'auto' : currentStream?.url || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'auto') {
                      setQualityMode('auto');
                      const autoStream = getAutoStream(streams);
                      if (autoStream && videoRef.current) {
                        const prevTime = videoRef.current.currentTime;
                        setCurrentStream(autoStream);
                        setTimeout(() => {
                          if (videoRef.current) videoRef.current.currentTime = prevTime;
                        }, 200);
                      }
                    } else {
                      setQualityMode('manual');
                      const selected = streams.find(s => s.url === val);
                      if (selected && videoRef.current) {
                        const prevTime = videoRef.current.currentTime;
                        setCurrentStream(selected);
                        setTimeout(() => {
                          if (videoRef.current) videoRef.current.currentTime = prevTime;
                        }, 200);
                      }
                    }
                  }}
                  className="player-select"
                >
                  <option value="auto">
                    Auto ({currentStream?.resolutions || 'Mendeteksi...'})
                  </option>
                  {streams.map((stream, idx) => (
                    <option key={idx} value={stream.url}>
                      {stream.resolutions || `Resolusi ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Next Episode Button */}
            {onNextEpisode && (
              <button className="control-btn next-ep-btn" onClick={onNextEpisode} title="Episode Berikutnya">
                Next Ep ⏭️
              </button>
            )}

            {/* Fullscreen */}
            <button className="control-btn fs-btn" onClick={toggleFullscreen} aria-label="Fullscreen">
              {fullscreen ? '🗗' : '🖥️'}
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .player-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: black;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          user-select: none;
        }

        .video-element {
          width: 100%;
          height: 100%;
          object-fit: contain;
          max-height: 100vh;
        }

        /* Subtitle Text Styling */
        video::cue {
          background-color: rgba(9, 9, 11, 0.8);
          color: #f4f4f5;
          font-family: 'Inter', sans-serif;
          font-size: 1.1em;
          border-radius: 4px;
        }

        /* Toast notification */
        .player-toast {
          position: absolute;
          top: 15%;
          left: 50%;
          transform: translateX(-50%);
          padding: var(--spacing-sm) var(--spacing-lg);
          border-radius: 20px;
          z-index: 1000;
          color: white;
          font-weight: 600;
          font-size: 14px;
          pointer-events: none;
          box-shadow: var(--shadow-high);
        }

        /* Loader */
        .player-loader-container {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
          color: var(--color-text-main);
          z-index: 100;
        }

        .player-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-left-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Header controls */
        .player-header {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          display: flex;
          align-items: center;
          padding: var(--spacing-md) var(--spacing-lg);
          z-index: 10;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 0;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .player-header.visible {
          opacity: 1;
          pointer-events: auto;
        }

        .back-btn {
          font-size: 15px;
          font-weight: 700;
          color: white;
          background-color: rgba(255, 255, 255, 0.1);
          padding: var(--spacing-xs) var(--spacing-md);
          border-radius: 8px;
          transition: background-color 0.2s ease;
        }

        .back-btn:hover {
          background-color: var(--color-primary);
        }

        .header-info {
          margin-left: var(--spacing-lg);
        }

        .player-title {
          font-size: 18px;
          font-weight: 700;
          color: white;
          line-height: 1.2;
        }

        .player-subtitle {
          font-size: 13px;
          color: var(--color-text-muted);
        }

        /* Bottom Controls Bar */
        .player-controls-wrapper {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          width: 95%;
          max-width: 1200px;
          border-radius: 16px;
          padding: var(--spacing-md);
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .player-controls-wrapper.visible {
          opacity: 1;
          pointer-events: auto;
        }

        /* Seekbar */
        .seekbar-container {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .time-display {
          font-size: 12px;
          font-weight: 600;
          color: white;
          font-family: monospace;
          min-width: 45px;
          text-align: center;
        }

        .seekbar-input {
          flex-grow: 1;
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }

        .seekbar-input::-webkit-slider-value-now {
          background: var(--color-primary);
        }

        .seekbar-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--color-primary);
          box-shadow: 0 0 5px var(--color-primary);
          transition: transform 0.1s ease;
        }

        .seekbar-input::-webkit-slider-thumb:hover {
          transform: scale(1.3);
        }

        /* Panel buttons */
        .controls-panel {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .left-controls, .right-controls {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .control-btn {
          font-size: 20px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease, transform 0.1s ease;
        }

        .control-btn:hover {
          background-color: var(--color-primary);
          color: white;
          transform: scale(1.1);
        }

        .skip-btn {
          font-size: 16px;
        }

        .fs-btn {
          font-size: 16px;
        }

        .next-ep-btn {
          font-size: 12px !important;
          width: auto !important;
          height: 34px !important;
          padding: 0 14px !important;
          border-radius: 17px !important;
          font-weight: 700;
          gap: 6px;
          background-color: var(--color-primary) !important;
          color: #000000 !important;
          box-shadow: var(--shadow-glow);
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
        }

        .next-ep-btn:hover {
          background-color: var(--color-primary-hover) !important;
          transform: scale(1.05) !important;
          color: #000000 !important;
        }

        /* Volume slider */
        .volume-container {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .volume-slider {
          width: 0;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
          transition: width 0.3s ease;
        }

        .volume-container:hover .volume-slider,
        .volume-slider:focus {
          width: 80px;
        }

        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: white;
        }

        /* Select Options */
        .selector-container {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          background-color: rgba(255, 255, 255, 0.08);
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .selector-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
        }

        .player-select {
          background: none;
          border: none;
          outline: none;
          color: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .player-select option {
          background-color: var(--color-background);
          color: white;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .player-controls-wrapper {
            bottom: 8px;
            width: 98%;
            padding: var(--spacing-sm);
          }
          
          .left-controls, .right-controls {
            gap: var(--spacing-xs);
          }
          
          .skip-btn, .volume-slider {
            display: none !important; /* Hide details on small touch screens */
          }
          
          .selector-container {
            padding: 4px 8px;
          }
          
          .player-select {
            font-size: 11px;
          }
        }
      ` }} />
    </div>
  );
}
