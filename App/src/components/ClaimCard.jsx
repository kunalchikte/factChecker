import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import './ClaimCard.css';

export function ClaimCard({ claim, type, index }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusInfo = () => {
    switch (type) {
      case 'correct':
        return {
          icon: CheckCircle,
          label: 'VERIFIED',
          className: 'claim-verified'
        };
      case 'incorrect':
        return {
          icon: XCircle,
          label: 'FALSE',
          className: 'claim-false'
        };
      case 'speculative':
        return {
          icon: AlertTriangle,
          label: 'SPECULATIVE',
          className: 'claim-speculative'
        };
      default:
        return {
          icon: AlertTriangle,
          label: 'UNKNOWN',
          className: ''
        };
    }
  };

  const { icon: Icon, label, className } = getStatusInfo();

  const getConfidenceColor = () => {
    switch (claim.confidence) {
      case 'HIGH':
        return 'confidence-high';
      case 'MEDIUM':
        return 'confidence-medium';
      case 'LOW':
        return 'confidence-low';
      default:
        return '';
    }
  };

  return (
    <div className={`claim-card ${className}`}>
      <div className="claim-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="claim-number">Claim {index + 1}</div>
        <div className="claim-content">
          <p className="claim-text">{claim.claim}</p>
          <div className="claim-status">
            <Icon size={18} />
            <span>{label}</span>
          </div>
        </div>
        <button className="expand-button">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="claim-details">
          <div className="claim-reasoning">
            <h4>{type === 'correct' ? 'Evidence' : type === 'incorrect' ? 'Correction' : 'Analysis'}:</h4>
            <p>{claim.reasoning}</p>
          </div>
          
          {claim.confidence && (
            <div className={`claim-confidence ${getConfidenceColor()}`}>
              <span>Confidence: {claim.confidence}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

