'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Clock, Loader2 } from 'lucide-react';
import { VideoInfo } from '@/components/VideoInfo';
import { TrustMeter } from '@/components/TrustMeter';
import { ClaimCard } from '@/components/ClaimCard';
import { StatsPanel } from '@/components/StatsPanel';
import { useHistoryContext } from '@/components/HistoryProvider';
import { getHistoryByVideoId } from '@/lib/api';
import './Result.css';

export function ResultClient({ id }) {
  const router = useRouter();
  const { getCachedResult, cacheResult, isHydrated } = useHistoryContext();
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // id is the video ID (e.g., "MsQACpcuTkU")
  const videoId = id;

  useEffect(() => {
    async function loadResult() {
      if (!isHydrated) return;

      setLoading(true);
      setError(null);

      // First, check if we have cached data from this session
      const cachedData = getCachedResult(videoId);
      if (cachedData) {
        setResult(cachedData);
        setLoading(false);
        return;
      }

      // If not cached, fetch from history API
      try {
        const response = await getHistoryByVideoId(videoId);
        if (response.status === 200 && response.data) {
          // Cache the result for future use in this session
          cacheResult(videoId, response);
          setResult(response);
        } else {
          setError('Analysis not found');
        }
      } catch (err) {
        console.error('Failed to fetch result:', err);
        setError(err.message || 'Failed to load analysis');
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [videoId, isHydrated, getCachedResult, cacheResult]);

  if (!isHydrated || loading) {
    return (
      <div className="result-page">
        <div className="result-loading">
          <Loader2 size={32} className="spinner" />
          <p>Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="result-not-found">
        <h2>Result not found</h2>
        <p>{error || 'This analysis may have been deleted or doesn\'t exist.'}</p>
        <Link href="/" className="back-home-btn">Go to Home</Link>
      </div>
    );
  }

  const { data } = result;
  const { video, summary, factCheck, trust, analysisNote, processingTime } = data;

  const allClaims = [
    ...(factCheck.correctClaims || []).map(c => ({ ...c, type: 'correct' })),
    ...(factCheck.incorrectClaims || []).map(c => ({ ...c, type: 'incorrect' })),
    ...(factCheck.speculativeClaims || []).map(c => ({ ...c, type: 'speculative' }))
  ];

  return (
    <div className="result-page">
      <button className="back-button" onClick={() => router.back()}>
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <div className="result-layout">
        <div className="result-main">
          <VideoInfo video={video} />

          <div className="result-section">
            <TrustMeter score={trust.score} level={trust.level} />
          </div>

          <div className="result-section">
            <StatsPanel factCheck={factCheck} />
          </div>

          <div className="result-section">
            <h2 className="section-title">
              <FileText size={20} />
              Summary
            </h2>
            <div className="summary-card">
              <p>{summary}</p>
            </div>
          </div>

          <div className="result-section">
            <h2 className="section-title">
              Claim-by-Claim Breakdown
              <span className="claim-count">{allClaims.length} claims</span>
            </h2>
            <div className="claims-list">
              {allClaims.map((claim, index) => (
                <ClaimCard 
                  key={index} 
                  claim={claim} 
                  type={claim.type}
                  index={index}
                />
              ))}
            </div>
          </div>

          {analysisNote && (
            <div className="analysis-note">
              <p><strong>Analysis Note:</strong> {analysisNote}</p>
            </div>
          )}

          <div className="processing-info">
            <Clock size={14} />
            <span>Processing time: {processingTime}</span>
          </div>
        </div>
      </div>

      {/* Structured Data for the Analysis */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ClaimReview',
            url: typeof window !== 'undefined' ? window.location.href : '',
            claimReviewed: video.title,
            itemReviewed: {
              '@type': 'VideoObject',
              name: video.title,
              url: video.url,
              duration: `PT${Math.floor(video.durationSeconds / 60)}M${video.durationSeconds % 60}S`,
            },
            author: {
              '@type': 'Organization',
              name: 'FactCheckAI',
            },
            reviewRating: {
              '@type': 'Rating',
              ratingValue: trust.score,
              bestRating: 100,
              worstRating: 0,
              alternateName: trust.level,
            },
          }),
        }}
      />
    </div>
  );
}

