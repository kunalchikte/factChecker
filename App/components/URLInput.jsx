'use client';

import { useState } from 'react';
import { Search, Loader2, Youtube } from 'lucide-react';
import { extractVideoId } from '@/lib/api';
import './URLInput.css';

export function URLInput({ onSubmit, isLoading }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    onSubmit(url);
  };

  return (
    <form onSubmit={handleSubmit} className="url-input-form">
      <div className="input-wrapper">
        <div className="input-icon">
          <Youtube size={20} />
        </div>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube URL to fact-check..."
          className="url-input"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="submit-button"
          disabled={isLoading || !url.trim()}
        >
          {isLoading ? (
            <Loader2 size={20} className="spinner" />
          ) : (
            <Search size={20} />
          )}
          <span className="button-text">Analyze</span>
        </button>
      </div>
      {error && <p className="input-error">{error}</p>}
    </form>
  );
}

