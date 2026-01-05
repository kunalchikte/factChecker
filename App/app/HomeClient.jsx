'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Shield, Zap, BarChart3 } from 'lucide-react';
import { URLInput } from '@/components/URLInput';
import { startVideoAnalysis, extractVideoId } from '@/lib/api';
import './Home.css';

export function HomeClient() {
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();

  const handleSubmit = (url) => {
    setError(null);
    setIsSubmitting(true);

    // Extract video ID from URL
    const videoId = extractVideoId(url);
    
    if (!videoId) {
      setError('Invalid YouTube URL. Please enter a valid YouTube video link.');
      setIsSubmitting(false);
      return;
    }

    // Fire the analyze API (fire-and-forget - don't wait for response)
    startVideoAnalysis(url);

    // Store the video ID in localStorage for tracking pending analyses
    try {
      const pendingAnalyses = JSON.parse(localStorage.getItem('pending-analyses') || '[]');
      if (!pendingAnalyses.includes(videoId)) {
        pendingAnalyses.push(videoId);
        localStorage.setItem('pending-analyses', JSON.stringify(pendingAnalyses));
      }
    } catch (e) {
      console.log('Could not save pending analysis:', e);
    }

    // Immediately redirect to analysis page (don't wait for API response)
    router.push(`/analysis/${videoId}`);
  };

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

        <URLInput onSubmit={handleSubmit} isLoading={isSubmitting} />

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
