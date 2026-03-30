import React from 'react';

const QualityScore = ({ score }) => {
  if (score === null || score === undefined) {
    return <span className="score-text" style={{ color: 'var(--text-muted)' }}>—</span>;
  }

  let level = 'high';
  if (score < 50) level = 'low';
  else if (score < 75) level = 'medium';

  return (
    <div className="quality-score">
      <div className="score-bar">
        <div
          className={`score-fill ${level}`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
      <span className={`score-text ${level}`}>{score}</span>
    </div>
  );
};

export default QualityScore;
