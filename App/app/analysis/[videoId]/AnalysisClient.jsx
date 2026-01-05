'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Search, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { checkAnalysisStatus } from '@/lib/api';
import { useHistoryContext } from '@/components/HistoryProvider';
import './Analysis.css';

const POLL_INTERVAL = 12000; // Poll every 12 seconds

const steps = [
  { icon: Search, label: 'Fetching video data...', duration: '~5s' },
  { icon: FileText, label: 'Extracting claims...', duration: '~30s' },
  { icon: CheckCircle, label: 'Verifying facts...', duration: '~1-2min' }
];

export function AnalysisClient({ videoId }) {
  const router = useRouter();
  const { addToHistory, cacheResult } = useHistoryContext();
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pollCount, setPollCount] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);
  
  const pollIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  // Timer to show elapsed time
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Animate through steps based on time
  useEffect(() => {
    if (elapsedTime > 5 && currentStep < 1) setCurrentStep(1);
    if (elapsedTime > 35 && currentStep < 2) setCurrentStep(2);
  }, [elapsedTime, currentStep]);

  // Polling logic
  useEffect(() => {
    if (!videoId) {
      setError('No video ID provided');
      return;
    }

    const checkStatus = async () => {
      setPollCount(prev => prev + 1);
      
      try {
        const result = await checkAnalysisStatus(videoId);
        
        if (result) {
          // Analysis complete! Cache the result and redirect
          cacheResult(videoId, result);
          
          // Add to history with the new format
          addToHistory(result);
          
          // Clear intervals before redirecting
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          
          // Redirect to result page
          router.replace(`/result/${videoId}`);
        }
        // If null, continue polling (handled by interval)
      } catch (err) {
        console.log('[Analysis] Poll error (will retry):', err.message);
        // Don't set error - keep polling
      }
    };

    // Initial check
    checkStatus();

    // Set up polling interval
    pollIntervalRef.current = setInterval(checkStatus, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [videoId, router, addToHistory, cacheResult]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  if (error) {
    return (
      <div className="analysis-container">
        <div className="analysis-card error">
          <AlertCircle size={48} className="error-icon" />
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => router.push('/')} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-container">
      <div className="analysis-card">
        {/* Video Preview */}
        <div className="video-preview">
          <Image
            src={thumbnailUrl}
            alt="Video thumbnail"
            width={320}
            height={180}
            className="preview-thumbnail"
            unoptimized
          />
          <div className="video-id-badge">
            <span>{videoId}</span>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="loading-spinner">
          <Loader2 size={56} className="spinner-icon" />
        </div>
        
        <h2 className="analysis-title">Analyzing Video</h2>
        <p className="analysis-subtitle">This may take 1-3 minutes for longer videos...</p>
        
        {/* Progress Steps */}
        <div className="analysis-steps">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`analysis-step ${index <= currentStep ? 'active' : ''} ${index < currentStep ? 'complete' : ''}`}
            >
              <div className="step-icon">
                {index < currentStep ? (
                  <CheckCircle size={18} />
                ) : (
                  <step.icon size={18} />
                )}
              </div>
              <span className="step-label">{step.label}</span>
              <span className="step-duration">{step.duration}</span>
            </div>
          ))}
        </div>

        {/* Timer and Status */}
        <div className="analysis-status">
          <div className="elapsed-time">
            <Clock size={16} />
            <span>Elapsed: {formatTime(elapsedTime)}</span>
          </div>
          <div className="poll-status">
            <span className="pulse-dot"></span>
            <span>Checking status... ({pollCount})</span>
          </div>
        </div>

        {/* Info Message */}
        <p className="analysis-info">
          You can leave this page open. We&apos;ll redirect you automatically when the analysis is complete.
        </p>
      </div>
    </div>
  );
}

