import { Link } from 'react-router-dom';
import { Clock, Trash2, ChevronRight, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { formatDuration } from '../services/api';
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

  const thumbnailUrl = `https://img.youtube.com/vi/${item.data?.video?.id}/mqdefault.jpg`;

  return (
    <div className="history-card">
      <Link to={`/result/${item.id}`} className="history-link">
        <div className="history-thumbnail">
          <img 
            src={thumbnailUrl} 
            alt={item.data?.video?.title}
            onError={(e) => {
              e.target.src = '/placeholder-video.png';
            }}
          />
        </div>
        
        <div className="history-content">
          <h3 className="history-title">{item.data?.video?.title}</h3>
          
          <div className="history-meta">
            <span className="history-date">
              <Clock size={12} />
              {formatDate(item.timestamp)}
            </span>
            
            {item.data?.video?.durationSeconds && (
              <span className="history-duration">
                {formatDuration(item.data.video.durationSeconds)}
              </span>
            )}
          </div>

          <div className="history-stats">
            <span className="history-stat verified">
              <CheckCircle size={12} />
              {item.data?.factCheck?.correctClaims?.length || 0}
            </span>
            <span className="history-stat false">
              <XCircle size={12} />
              {item.data?.factCheck?.incorrectClaims?.length || 0}
            </span>
            <span className="history-stat speculative">
              <AlertTriangle size={12} />
              {item.data?.factCheck?.speculativeClaims?.length || 0}
            </span>
            <span className="history-trust">
              Trust: {item.data?.trust?.score}%
            </span>
          </div>
        </div>

        <ChevronRight size={20} className="history-arrow" />
      </Link>

      <button 
        className="history-delete"
        onClick={(e) => {
          e.preventDefault();
          onDelete(item.id);
        }}
        title="Remove from history"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

