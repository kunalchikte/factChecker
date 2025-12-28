'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Shield, Zap, BarChart3 } from 'lucide-react';
import { URLInput } from '@/components/URLInput';
import { Loading } from '@/components/Loading';
import { analyzeVideo } from '@/lib/api';
import { useHistoryContext } from '@/components/HistoryProvider';
import './Home.css';

export function HomeClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { addToHistory } = useHistoryContext();

  const handleSubmit = async (url) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await analyzeVideo(url);
      
      if (response.status === 200 && response.data) {
        const historyItem = addToHistory(response);
        router.push(`/result/${historyItem.id}`);
      } else {
        throw new Error(response.msg || 'Failed to analyze video');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="home">
        <Loading />
      </div>
    );
  }

  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-badge">
          <Sparkles size={14} />
          <span>AI-Powered Fact Checking</span>
        </div>
        
        <h1 className="hero-title">
          Verify YouTube Videos<br />
          <span className="hero-gradient">Instantly</span>
        </h1>
        
        <p className="hero-subtitle">
          Paste any YouTube URL and get AI-powered fact-checking analysis 
          with detailed claim verification and trust scores.
        </p>

        <URLInput onSubmit={handleSubmit} isLoading={isLoading} />

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
      </div>

      <div className="features-section">
        <div className="feature-card">
          <div className="feature-icon">
            <Shield size={24} />
          </div>
          <h3>Claim Verification</h3>
          <p>Each claim in the video is individually analyzed and verified against reliable sources.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Zap size={24} />
          </div>
          <h3>Fast Analysis</h3>
          <p>Get comprehensive fact-checking results in seconds using advanced AI models.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <BarChart3 size={24} />
          </div>
          <h3>Trust Score</h3>
          <p>Receive an overall trust score based on the accuracy of claims in the video.</p>
        </div>
      </div>
    </div>
  );
}

