'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const HistoryContext = createContext(null);

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
  const [history, setHistory, isHydrated] = useLocalStorage('factcheck-history', []);

  const addToHistory = (result) => {
    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...result
    };
    setHistory(prev => [newEntry, ...prev]);
    return newEntry;
  };

  const removeFromHistory = (id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const getHistoryItem = (id) => {
    return history.find(item => item.id === id);
  };

  return (
    <HistoryContext.Provider value={{
      history,
      addToHistory,
      removeFromHistory,
      clearHistory,
      getHistoryItem,
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

