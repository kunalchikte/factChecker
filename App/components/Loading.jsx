import { Loader2, Search, FileText, CheckCircle } from 'lucide-react';
import './Loading.css';

const steps = [
  { icon: Search, label: 'Fetching video data...' },
  { icon: FileText, label: 'Extracting claims...' },
  { icon: CheckCircle, label: 'Verifying facts...' }
];

export function Loading() {
  return (
    <div className="loading-container">
      <div className="loading-card">
        <div className="loading-spinner">
          <Loader2 size={48} className="spinner-icon" />
        </div>
        
        <h2 className="loading-title">Analyzing Video</h2>
        <p className="loading-subtitle">This may take a moment...</p>
        
        <div className="loading-steps">
          {steps.map((step, index) => (
            <div key={index} className="loading-step">
              <step.icon size={18} />
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

