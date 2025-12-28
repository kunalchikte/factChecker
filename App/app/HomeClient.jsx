'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Shield, Zap, BarChart3 } from 'lucide-react';
import { URLInput } from '@/components/URLInput';
import { Loading } from '@/components/Loading';
import { LoginModal } from '@/components/LoginModal';
import { analyzeVideo } from '@/lib/api';
import { useHistoryContext } from '@/components/HistoryProvider';
import { useAuth } from '@/components/AuthProvider';
import './Home.css';

export function HomeClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingResult, setPendingResult] = useState(null);
  
  const router = useRouter();
  const { addToHistory } = useHistoryContext();
  const { user } = useAuth();

  const handleSubmit = async (url) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await analyzeVideo(url);
      
      if (response.status === 200 && response.data) {
        // Store the result temporarily
        setPendingResult(response);
        
        // If user is not logged in, show login modal
        if (!user) {
          setIsLoading(false);
          setShowLoginModal(true);
        } else {
          // User is already logged in, proceed directly
          proceedWithResult(response);
        }
      } else {
        throw new Error(response.msg || 'Failed to analyze video');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze video. Please try again.');
      setIsLoading(false);
    }
  };

  const proceedWithResult = (response) => {
    const historyItem = addToHistory(response);
    if (historyItem) {
      // Navigate using video ID, not timestamp
      router.push(`/result/${historyItem.videoId}`);
    }
  };

  const handleLoginSuccess = (loggedInUser) => {
    setShowLoginModal(false);
    
    // Proceed with the pending result (whether user logged in or skipped)
    if (pendingResult) {
      proceedWithResult(pendingResult);
    }
  };

  const handleLoginClose = () => {
    setShowLoginModal(false);
    setPendingResult(null);
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

      {/* Login Modal - shown after successful API response */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={handleLoginClose}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
