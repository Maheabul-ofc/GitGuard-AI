import React from 'react';

const StatusBadge = ({ status }) => {
  const statusMap = {
    Reviewed: 'badge-reviewed',
    Pending: 'badge-pending',
    Analyzing: 'badge-analyzing',
    Error: 'badge-error',
    Success: 'badge-reviewed',
  };

  const iconMap = {
    Reviewed: '✅',
    Pending: '⏳',
    Analyzing: '🔄',
    Error: '❌',
    Success: '✅',
  };

  return (
    <span className={`badge ${statusMap[status] || 'badge-pending'}`}>
      {iconMap[status] || '⚪'} {status}
    </span>
  );
};

export default StatusBadge;
