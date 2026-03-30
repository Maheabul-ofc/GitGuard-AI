import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'stats':
        return (
          <div className="stats-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="stat-card skeleton-card" key={i}>
                <div className="skeleton-line skeleton-icon"></div>
                <div className="skeleton-line skeleton-value"></div>
                <div className="skeleton-line skeleton-label"></div>
              </div>
            ))}
          </div>
        );
      case 'table':
        return (
          <div className="table-container">
            <div className="table-header">
              <div className="skeleton-line" style={{ width: '150px', height: '20px' }}></div>
            </div>
            {Array.from({ length: count }).map((_, i) => (
              <div className="skeleton-table-row" key={i}>
                <div className="skeleton-line" style={{ width: '20%' }}></div>
                <div className="skeleton-line" style={{ width: '8%' }}></div>
                <div className="skeleton-line" style={{ width: '25%' }}></div>
                <div className="skeleton-line" style={{ width: '12%' }}></div>
                <div className="skeleton-line" style={{ width: '10%' }}></div>
              </div>
            ))}
          </div>
        );
      case 'detail':
        return (
          <div>
            <div className="skeleton-detail-header">
              <div className="skeleton-line" style={{ width: '60%', height: '28px', marginBottom: '12px' }}></div>
              <div className="skeleton-line" style={{ width: '40%', height: '16px' }}></div>
            </div>
            {Array.from({ length: count }).map((_, i) => (
              <div className="skeleton-issue-card" key={i}>
                <div className="skeleton-line" style={{ width: '30%', height: '20px', marginBottom: '12px' }}></div>
                <div className="skeleton-line" style={{ width: '100%', height: '14px', marginBottom: '8px' }}></div>
                <div className="skeleton-line" style={{ width: '80%', height: '14px' }}></div>
              </div>
            ))}
          </div>
        );
      default:
        return (
          <div className="skeleton-card">
            <div className="skeleton-line" style={{ width: '60%', height: '20px', marginBottom: '12px' }}></div>
            <div className="skeleton-line" style={{ width: '100%', height: '14px', marginBottom: '8px' }}></div>
            <div className="skeleton-line" style={{ width: '80%', height: '14px' }}></div>
          </div>
        );
    }
  };

  return <div className="skeleton-container">{renderSkeleton()}</div>;
};

export default SkeletonLoader;
