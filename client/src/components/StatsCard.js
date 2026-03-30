import React from 'react';

const StatsCard = ({ icon, value, label, change, changeType }) => {
  return (
    <div className="stat-card animate-in">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value !== null && value !== undefined ? value : '—'}</div>
      <div className="stat-label">{label}</div>
      {change && (
        <div className={`stat-change ${changeType || 'positive'}`}>
          {changeType === 'positive' ? '↑' : '↓'} {change}
        </div>
      )}
    </div>
  );
};

export default StatsCard;
