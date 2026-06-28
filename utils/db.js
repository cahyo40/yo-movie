// Local Storage Database Client Utilities
// SSR Safe: checks for typeof window !== 'undefined'

const KEYS = {
  HISTORY: 'moviebox_history',
  BOOKMARKS: 'moviebox_bookmarks',
  RESUME: 'moviebox_resume'
};

// Helper: safe read
function safeRead(key, defaultValue) {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`[DB] Error reading key ${key}:`, e);
    return defaultValue;
  }
}

// Helper: safe write
function safeWrite(key, data) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`[DB] Error writing key ${key}:`, e);
  }
}

/* ==========================================================================
   WATCH HISTORY FUNCTIONS
   ========================================================================== */

export const db = {
  // Get all history items sorted by newest timestamp
  getHistory() {
    return safeRead(KEYS.HISTORY, []);
  },

  // Add an item to history
  addToHistory(media) {
    const history = this.getHistory();
    // Remove if already exists (to push to top)
    const filtered = history.filter(item => item.id !== media.id);
    
    // Add to beginning of array
    const newItem = {
      id: media.id,
      title: media.title,
      cover: media.cover,
      type: media.type,
      detailPath: media.detailPath,
      timestamp: Date.now()
    };
    
    const updated = [newItem, ...filtered].slice(0, 100); // Limit to 100 entries
    safeWrite(KEYS.HISTORY, updated);
    return updated;
  },

  // Remove individual item from history
  removeFromHistory(id) {
    const history = this.getHistory();
    const updated = history.filter(item => item.id !== id);
    safeWrite(KEYS.HISTORY, updated);
    return updated;
  },

  // Clear entire history
  clearHistory() {
    safeWrite(KEYS.HISTORY, []);
    return [];
  },

  /* ==========================================================================
     BOOKMARKS FUNCTIONS
     ========================================================================== */

  getBookmarksData() {
    const defaultData = {
      bookmarks: [],
      categories: ['Favorit', 'Tonton Nanti']
    };
    return safeRead(KEYS.BOOKMARKS, defaultData);
  },

  addBookmark(media, category = 'Favorit') {
    const data = this.getBookmarksData();
    // Check if already bookmarked
    const exists = data.bookmarks.some(item => item.id === media.id);
    if (exists) {
      // Update its category
      data.bookmarks = data.bookmarks.map(item => 
        item.id === media.id ? { ...item, category } : item
      );
    } else {
      // Add new
      data.bookmarks.push({
        id: media.id,
        title: media.title,
        cover: media.cover,
        type: media.type,
        detailPath: media.detailPath,
        category,
        timestamp: Date.now()
      });
    }

    // Add category if not present
    if (!data.categories.includes(category)) {
      data.categories.push(category);
    }

    safeWrite(KEYS.BOOKMARKS, data);
    return data;
  },

  removeBookmark(id) {
    const data = this.getBookmarksData();
    data.bookmarks = data.bookmarks.filter(item => item.id !== id);
    safeWrite(KEYS.BOOKMARKS, data);
    return data;
  },

  addCategory(category) {
    const data = this.getBookmarksData();
    const trimmed = category.trim();
    if (trimmed && !data.categories.includes(trimmed)) {
      data.categories.push(trimmed);
      safeWrite(KEYS.BOOKMARKS, data);
    }
    return data;
  },

  removeCategory(category) {
    const data = this.getBookmarksData();
    // Filter categories
    data.categories = data.categories.filter(cat => cat !== category);
    // Remove bookmarks associated with this category
    data.bookmarks = data.bookmarks.filter(item => item.category !== category);
    safeWrite(KEYS.BOOKMARKS, data);
    return data;
  },

  /* ==========================================================================
     RESUME PLAYBACK (CONTINUE WATCHING) FUNCTIONS
     ========================================================================== */

  getResumeList() {
    return safeRead(KEYS.RESUME, {});
  },

  getResume(id) {
    const list = this.getResumeList();
    return list[id] || null;
  },

  saveResume(id, { season, episode, time, duration, title, cover, type, detailPath }) {
    const list = this.getResumeList();
    list[id] = {
      season: season || 0,
      episode: episode || 0,
      time: time || 0,
      duration: duration || 0,
      percentage: duration > 0 ? parseFloat(((time / duration) * 100).toFixed(1)) : 0,
      title,
      cover,
      type,
      detailPath,
      updatedAt: Date.now()
    };
    safeWrite(KEYS.RESUME, list);
    return list[id];
  },

  clearResume(id) {
    const list = this.getResumeList();
    delete list[id];
    safeWrite(KEYS.RESUME, list);
    return list;
  },

  clearAllResume() {
    safeWrite(KEYS.RESUME, {});
    return {};
  },

  /* ==========================================================================
     BACKUP IMPORT/EXPORT FUNCTIONS
     ========================================================================== */

  exportData() {
    const bookmarks = this.getBookmarksData();
    const history = this.getHistory();
    const resume = this.getResumeList();

    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        bookmarks,
        history,
        resume
      }
    };
    return JSON.stringify(backup, null, 2);
  },

  importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Simple validation of schema
      if (!parsed || parsed.version !== '1.0' || !parsed.data) {
        throw new Error('Format backup tidak valid.');
      }

      const { bookmarks, history, resume } = parsed.data;

      // Validate bookmarks
      if (bookmarks && Array.isArray(bookmarks.bookmarks) && Array.isArray(bookmarks.categories)) {
        safeWrite(KEYS.BOOKMARKS, bookmarks);
      }

      // Validate history
      if (history && Array.isArray(history)) {
        safeWrite(KEYS.HISTORY, history);
      }

      // Validate resume progress
      if (resume && typeof resume === 'object') {
        safeWrite(KEYS.RESUME, resume);
      }

      return { success: true };
    } catch (e) {
      console.error('[DB] Gagal mengimpor data:', e);
      return { success: false, error: e.message };
    }
  }
};
