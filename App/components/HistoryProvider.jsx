'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';

const HistoryContext = createContext(null);

// Hook for storing video IDs in localStorage
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
      setIsHydrated(true);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      setIsHydrated(true);
    }
  }, [key]);

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };

  return [storedValue, setValue, isHydrated];
}

export function HistoryProvider({ children }) {
  // Store only video IDs with timestamps in localStorage
  const [videoHistory, setVideoHistory, isHydrated] = useLocalStorage('factcheck-video-history', []);
  
  // In-memory cache for full result data (current session only)
  const resultCache = useRef(new Map());

  // Add a new result to history - stores only video ID, caches full data
  const addToHistory = (result) => {
    const videoId = result.data?.video?.id;
    if (!videoId) {
      console.error('No video ID found in result');
      return null;
    }

    const newEntry = {
      videoId,
      timestamp: new Date().toISOString(),
      title: result.data?.video?.title || 'Unknown Video',
      trustScore: result.data?.trust?.score || 0,
      trustLevel: result.data?.trust?.level || 'UNKNOWN',
    };

    // Cache the full result for this session
    resultCache.current.set(videoId, result);

    // Add to localStorage (only essential data)
    setVideoHistory(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(item => item.videoId !== videoId);
      return [newEntry, ...filtered];
    });

    return { id: videoId, ...newEntry };
  };

  // Remove from history
  const removeFromHistory = (videoId) => {
    setVideoHistory(prev => prev.filter(item => item.videoId !== videoId));
    resultCache.current.delete(videoId);
  };

  // Clear all history
  const clearHistory = () => {
    setVideoHistory([]);
    resultCache.current.clear();
  };

  // Get cached result data (for current session)
  const getCachedResult = (videoId) => {
    return resultCache.current.get(videoId) || null;
  };

  // Cache result data (when fetched from API)
  const cacheResult = (videoId, result) => {
    resultCache.current.set(videoId, result);
  };

  // Get history entry by video ID (basic info only)
  const getHistoryEntry = (videoId) => {
    return videoHistory.find(item => item.videoId === videoId);
  };

  return (
    <HistoryContext.Provider value={{
      history: videoHistory,
      addToHistory,
      removeFromHistory,
      clearHistory,
      getCachedResult,
      cacheResult,
      getHistoryEntry,
      isHydrated
    }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistoryContext() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistoryContext must be used within a HistoryProvider');
  }
  return context;
}

