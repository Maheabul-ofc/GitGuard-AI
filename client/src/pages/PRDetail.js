import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPullRequestById, reanalyzePR } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import QualityScore from '../components/QualityScore';
import SeverityBadge from '../components/SeverityBadge';

const PRDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pr, setPr] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);

  useEffect(() => {
    fetchPRDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPRDetail = async () => {
    setLoading(true);
    try {
      const { data } = await getPullRequestById(id);
      setPr(data.pullRequest);
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Failed to fetch PR:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      await reanalyzePR(id);
      // Wait a moment then refresh
      setTimeout(() => {
        fetchPRDetail();
        setReanalyzing(false);
      }, 2000);
    } catch (error) {
      console.error('Re-analysis failed:', error);
      setReanalyzing(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIssueIcon = (type) => {
    switch (type) {
      case 'Bug': return '🐛';
      case 'Security': return '🔐';
      case 'Performance': return '⚡';
      case 'Style': return '🎨';
      case 'Best Practice': return '📘';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!pr) {
    return (
      <div className="empty-state">
        <div className="empty-icon">❌</div>
        <h3>Pull Request Not Found</h3>
        <p>The requested PR could not be found.</p>
        <button className="btn-primary" onClick={() => navigate('/pr-history')} style={{ marginTop: '16px' }}>
          ← Back to PR History
        </button>
      </div>
    );
  }

  const criticals = reviews.filter(r => r.severity === 'Critical');
  const warnings = reviews.filter(r => r.severity === 'Warning');
  const suggestions = reviews.filter(r => r.severity === 'Suggestion');

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate('/pr-history')}
        className="btn-back"
      >
        ← Back to PR History
      </button>

      {/* PR Header Card */}
      <div className="pr-detail-header animate-in">
        <div className="pr-detail-title-row">
          <div>
            <h2 className="pr-detail-title">
              {pr.prTitle || `PR #${pr.prNumber}`}
            </h2>
            <div className="pr-detail-meta">
              <span className="pr-meta-item">📁 {pr.repoName}</span>
              <span className="pr-meta-item">#{pr.prNumber}</span>
              <span className="pr-meta-item">👤 {pr.author}</span>
              <span className="pr-meta-item">📅 {formatDate(pr.createdAt)}</span>
            </div>
          </div>
          <div className="pr-detail-actions">
            <StatusBadge status={pr.status} />
            <button
              className={`btn-reanalyze ${reanalyzing ? 'loading' : ''}`}
              onClick={handleReanalyze}
              disabled={reanalyzing}
            >
              {reanalyzing ? '🔄 Analyzing...' : '🔁 Re-analyze'}
            </button>
            {pr.htmlUrl && (
              <a
                href={pr.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-github"
              >
                🔗 View on GitHub
              </a>
            )}
          </div>
        </div>

        {/* Score & Stats Row */}
        <div className="pr-detail-stats">
          <div className="pr-stat-box">
            <div className="pr-stat-label">Quality Score</div>
            <div className="pr-stat-value-large">
              <QualityScore score={pr.codeQualityScore} />
            </div>
          </div>
          <div className="pr-stat-box">
            <div className="pr-stat-label">Total Issues</div>
            <div className="pr-stat-value-large">
              <span style={{
                fontSize: '28px',
                fontWeight: '800',
                color: reviews.length > 0 ? 'var(--warning)' : 'var(--success)'
              }}>
                {reviews.length}
              </span>
            </div>
          </div>
          <div className="pr-stat-box">
            <div className="pr-stat-label">🔴 Critical</div>
            <div className="pr-stat-count critical">{criticals.length}</div>
          </div>
          <div className="pr-stat-box">
            <div className="pr-stat-label">🟡 Warning</div>
            <div className="pr-stat-count warning">{warnings.length}</div>
          </div>
          <div className="pr-stat-box">
            <div className="pr-stat-label">🟢 Suggestion</div>
            <div className="pr-stat-count suggestion">{suggestions.length}</div>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="pr-issues-section animate-in" style={{ animationDelay: '0.2s' }}>
        <h3 className="section-title">🔍 Detailed Findings</h3>

        {reviews.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>No Issues Found</h3>
            <p>This code looks clean and well-written! Great work. 🎉</p>
          </div>
        ) : (
          <div className="issues-list">
            {reviews.map((review, index) => (
              <div className="issue-card animate-in" key={review._id || index} style={{ animationDelay: `${0.1 * index}s` }}>
                <div className="issue-card-header">
                  <div className="issue-title-row">
                    <span className="issue-number">#{index + 1}</span>
                    <span className="issue-type-icon">{getIssueIcon(review.issueType)}</span>
                    <span className="issue-type-text">{review.issueType}</span>
                  </div>
                  <SeverityBadge severity={review.severity} />
                </div>

                {review.fileName && (
                  <div className="issue-file">
                    📁 <code>{review.fileName}</code>
                  </div>
                )}

                <div className="issue-description">
                  {review.description}
                </div>

                {review.suggestedFix && (
                  <div className="issue-fix">
                    <div className="issue-fix-label">💡 Suggested Fix</div>
                    <pre className="issue-fix-code">
                      <code>{review.suggestedFix}</code>
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PRDetail;
