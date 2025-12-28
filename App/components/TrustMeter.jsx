import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import './TrustMeter.css';

export function TrustMeter({ score, level }) {
  const getStatusInfo = () => {
    if (score >= 80) {
      return {
        label: 'HIGHLY TRUSTWORTHY',
        icon: ShieldCheck,
        className: 'trust-high'
      };
    } else if (score >= 60) {
      return {
        label: 'PARTIALLY TRUE',
        icon: ShieldQuestion,
        className: 'trust-medium'
      };
    } else if (score >= 40) {
      return {
        label: 'QUESTIONABLE',
        icon: ShieldAlert,
        className: 'trust-low'
      };
    } else {
      return {
        label: 'UNRELIABLE',
        icon: Shield,
        className: 'trust-very-low'
      };
    }
  };

  const { label, icon: Icon, className } = getStatusInfo();
  const blocks = 10;
  const filledBlocks = Math.round((score / 100) * blocks);

  return (
    <div className={`trust-meter ${className}`}>
      <div className="trust-badge">
        <Icon size={16} />
        <span>{label}</span>
      </div>
      
      <div className="trust-score-container">
        <h3 className="trust-label">Trust Score: {score}%</h3>
        <div className="trust-blocks">
          {Array.from({ length: blocks }).map((_, i) => (
            <div 
              key={i} 
              className={`trust-block ${i < filledBlocks ? 'filled' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

