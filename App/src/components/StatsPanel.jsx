import { CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import './StatsPanel.css';

export function StatsPanel({ factCheck }) {
  const stats = [
    {
      label: 'Verified Claims',
      value: factCheck.correctClaims?.length || 0,
      percentage: factCheck.correctPercentage,
      icon: CheckCircle,
      className: 'stat-verified'
    },
    {
      label: 'False Claims',
      value: factCheck.incorrectClaims?.length || 0,
      percentage: factCheck.incorrectPercentage,
      icon: XCircle,
      className: 'stat-false'
    },
    {
      label: 'Speculative',
      value: factCheck.speculativeClaims?.length || 0,
      percentage: factCheck.speculativePercentage,
      icon: AlertTriangle,
      className: 'stat-speculative'
    }
  ];

  return (
    <div className="stats-panel">
      <h3 className="stats-title">
        <TrendingUp size={18} />
        Video Content Accuracy
      </h3>
      
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat-item ${stat.className}`}>
            <div className="stat-header">
              <stat.icon size={16} />
              <span className="stat-label">{stat.label}</span>
            </div>
            <div className="stat-bar-container">
              <div 
                className="stat-bar"
                style={{ width: `${stat.percentage}%` }}
              />
            </div>
            <div className="stat-value">{stat.percentage}%</div>
          </div>
        ))}
      </div>

      <div className="total-claims">
        <span>Total Claims Analyzed:</span>
        <strong>{factCheck.totalClaims}</strong>
      </div>
    </div>
  );
}

