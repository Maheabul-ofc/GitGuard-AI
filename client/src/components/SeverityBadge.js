import React from 'react';

const SeverityBadge = ({ severity }) => {
  const severityMap = {
    Critical: 'badge-critical',
    Warning: 'badge-warning',
    Suggestion: 'badge-suggestion'
  };

  const iconMap = {
    Critical: '🔴',
    Warning: '🟡',
    Suggestion: '🟢'
  };

  return (
    <span className={`badge ${severityMap[severity] || 'badge-suggestion'}`}>
      {iconMap[severity] || '⚪'} {severity}
    </span>
  );
};

export default SeverityBadge;
