import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };

  return [storedValue, setValue];
}

export function useHistory() {
  const [history, setHistory] = useLocalStorage('factcheck-history', []);

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

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getHistoryItem
  };
}

