'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { signInWithGoogle, signInWithApple } from '@/lib/firebase';
import './LoginModal.css';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}

export function LoginModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading('google');
    setError('');
    
    const { user, error } = await signInWithGoogle();
    
    if (user) {
      onSuccess(user);
    } else {
      setError(error || 'Failed to sign in with Google');
    }
    setLoading(null);
  };

  const handleAppleLogin = async () => {
    setLoading('apple');
    setError('');
    
    const { user, error } = await signInWithApple();
    
    if (user) {
      onSuccess(user);
    } else {
      setError(error || 'Failed to sign in with Apple');
    }
    setLoading(null);
  };

  const handleSkip = () => {
    onSuccess(null); // Allow proceeding without login
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <div className="modal-icon">🔐</div>
          <h2>Sign in to Continue</h2>
          <p>Save your analysis history across devices and access premium features.</p>
        </div>

        <div className="modal-buttons">
          <button 
            className="auth-button google"
            onClick={handleGoogleLogin}
            disabled={loading !== null}
          >
            {loading === 'google' ? (
              <Loader2 size={20} className="spinner" />
            ) : (
              <GoogleIcon />
            )}
            <span>Continue with Google</span>
          </button>

          <button 
            className="auth-button apple"
            onClick={handleAppleLogin}
            disabled={loading !== null}
          >
            {loading === 'apple' ? (
              <Loader2 size={20} className="spinner" />
            ) : (
              <AppleIcon />
            )}
            <span>Continue with Apple</span>
          </button>
        </div>

        {error && (
          <p className="modal-error">{error}</p>
        )}

        <div className="modal-divider">
          <span>or</span>
        </div>

        <button 
          className="skip-button"
          onClick={handleSkip}
          disabled={loading !== null}
        >
          Continue as Guest
        </button>

        <p className="modal-terms">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

