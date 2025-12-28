'use client';

import { History as HistoryIcon, Trash2 } from 'lucide-react';
import { HistoryCard } from '@/components/HistoryCard';
import { useHistoryContext } from '@/components/HistoryProvider';
import './History.css';

export function HistoryClient() {
  const { history, removeFromHistory, clearHistory, isHydrated } = useHistoryContext();

  if (!isHydrated) {
    return (
      <div className="history-page">
        <div className="history-header">
          <div className="history-title-section">
            <h1 className="history-page-title">
              <HistoryIcon size={28} />
              Analysis History
            </h1>
            <p className="history-subtitle">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <div className="history-title-section">
          <h1 className="history-page-title">
            <HistoryIcon size={28} />
            Analysis History
          </h1>
          <p className="history-subtitle">
            {history.length} {history.length === 1 ? 'report' : 'reports'} saved locally
          </p>
        </div>

        {history.length > 0 && (
          <button 
            className="clear-history-btn"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all history?')) {
                clearHistory();
              }
            }}
          >
            <Trash2 size={16} />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="history-empty">
          <div className="empty-icon">
            <HistoryIcon size={48} />
          </div>
          <h2>No history yet</h2>
          <p>Analyzed videos will appear here for easy access.</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <HistoryCard 
              key={item.id} 
              item={item} 
              onDelete={removeFromHistory}
            />
          ))}
        </div>
      )}
    </div>
  );
}

