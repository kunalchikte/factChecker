import { Clock, Play, ExternalLink, Share2 } from 'lucide-react';
import { formatDuration } from '../services/api';
import './VideoInfo.css';

// Social media icons as SVG components
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

export function VideoInfo({ video, resultId }) {
  const thumbnailUrl = `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`;
  
  // Generate share URL - this will be the current page URL
  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  };

  const shareText = `Check out this fact-check analysis: "${video.title}"`;
  
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(getShareUrl())}`
  };

  const handleShare = (platform) => {
    const url = shareLinks[platform];
    window.open(url, '_blank', 'width=600,height=400,scrollbars=yes');
  };

  return (
    <div className="video-info">
      <div className="video-thumbnail-container">
        <a 
          href={video.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="video-thumbnail-link"
        >
          <img 
            src={thumbnailUrl} 
            alt={video.title}
            className="video-thumbnail"
            onError={(e) => {
              e.target.src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
            }}
          />
          <div className="play-overlay">
            <Play size={48} fill="white" />
          </div>
        </a>
      </div>
      
      <div className="video-details">
        <div className="video-header">
          <h2 className="video-title">{video.title}</h2>
          
          <div className="share-buttons">
            <span className="share-label">
              <Share2 size={14} />
              Share
            </span>
            <button 
              className="share-btn facebook"
              onClick={() => handleShare('facebook')}
              title="Share on Facebook"
            >
              <FacebookIcon />
            </button>
            <button 
              className="share-btn linkedin"
              onClick={() => handleShare('linkedin')}
              title="Share on LinkedIn"
            >
              <LinkedInIcon />
            </button>
            <button 
              className="share-btn twitter"
              onClick={() => handleShare('twitter')}
              title="Share on X (Twitter)"
            >
              <TwitterIcon />
            </button>
          </div>
        </div>
        
        <div className="video-meta">
          {video.topic && (
            <span className="video-topic">{video.topic}</span>
          )}
          <div className="video-duration">
            <Clock size={14} />
            <span>{formatDuration(video.durationSeconds)}</span>
          </div>
        </div>
        
        <a 
          href={video.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="watch-link"
        >
          <ExternalLink size={14} />
          <span>Watch on YouTube</span>
        </a>
      </div>
    </div>
  );
}
