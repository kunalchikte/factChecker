'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, Trash2, ChevronRight, Shield } from 'lucide-react';
import './HistoryCard.css';

export function HistoryCard({ item, onDelete }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Use videoId for thumbnail and navigation
  const thumbnailUrl = `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`;

  // Get trust level color
  const getTrustColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'HIGH': return 'trust-high';
      case 'MEDIUM': return 'trust-medium';
      case 'LOW': return 'trust-low';
      default: return 'trust-unknown';
    }
  };

  return (
    <div className="history-card">
      <Link href={`/result/${item.videoId}`} className="history-link">
        <div className="history-thumbnail">
          <Image 
            src={thumbnailUrl} 
            alt={item.title || 'Video thumbnail'}
            width={120}
            height={68}
            unoptimized
          />
        </div>
        
        <div className="history-content">
          <h3 className="history-title">{item.title || 'Unknown Video'}</h3>
          
          <div className="history-meta">
            <span className="history-date">
              <Clock size={12} />
              {formatDate(item.timestamp)}
            </span>
          </div>

          <div className="history-stats">
            <span className={`history-trust ${getTrustColor(item.trustLevel)}`}>
              <Shield size={12} />
              Trust: {item.trustScore || 0}%
            </span>
            <span className="trust-level-badge">
              {item.trustLevel || 'UNKNOWN'}
            </span>
          </div>
        </div>

        <ChevronRight size={20} className="history-arrow" />
      </Link>

      <button 
        className="history-delete"
        onClick={(e) => {
          e.preventDefault();
          onDelete(item.videoId);
        }}
        title="Remove from history"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

