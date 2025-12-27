import { createContext, useContext } from 'react';
import { useHistory } from '../hooks/useLocalStorage';

const HistoryContext = createContext(null);

export function HistoryProvider({ children }) {
  const historyUtils = useHistory();

  return (
    <HistoryContext.Provider value={historyUtils}>
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

