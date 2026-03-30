import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/api';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import QualityScore from '../components/QualityScore';
import SkeletonLoader from '../components/SkeletonLoader';

// Animated counter hook
const useCountUp = (end, duration = 1200) => {
  const [count, setCount] = useState(0);
  const startTime = useRef(null);
  const rafId = useRef(null);

  useEffect(() => {
    if (end === null || end === undefined || end === 0) {
      setCount(end || 0);
      return;
    }

    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * end));
      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      }
    };

    rafId.current = requestAnimationFrame(animate);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [end, duration]);

  return count;
};

// Donut Chart Component
const DonutChart = ({ critical = 0, warning = 0, suggestion = 0 }) => {
  const total = critical + warning + suggestion;
  if (total === 0) {
    return (
      <div className="donut-empty">
        <div className="donut-ring empty">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-color)" strokeWidth="8" />
          </svg>
          <div className="donut-center">
            <span className="donut-total">0</span>
            <span className="donut-label">Issues</span>
          </div>
        </div>
      </div>
    );
  }

  const critPct = (critical / total) * 100;
  const warnPct = (warning / total) * 100;
  const sugPct = (suggestion / total) * 100;

  // SVG circle circumference = 2 * π * 40 ≈ 251.33
  const circumference = 251.33;
  const critLen = (critPct / 100) * circumference;
  const warnLen = (warnPct / 100) * circumference;
  const sugLen = (sugPct / 100) * circumference;

  return (
    <div className="donut-chart-wrapper">
      <div className="donut-ring">
        <svg viewBox="0 0 100 100">
          {/* Suggestion (green) — base layer */}
          <circle
            cx="50" cy="50" r="40"
            fill="none" stroke="var(--suggestion)" strokeWidth="8"
            strokeDasharray={`${sugLen} ${circumference}`}
            strokeDashoffset={0}
            transform="rotate(-90 50 50)"
            className="donut-segment"
          />
          {/* Warning (yellow) */}
          <circle
            cx="50" cy="50" r="40"
            fill="none" stroke="var(--warning-sev)" strokeWidth="8"
            strokeDasharray={`${warnLen} ${circumference}`}
            strokeDashoffset={-sugLen}
            transform="rotate(-90 50 50)"
            className="donut-segment"
          />
          {/* Critical (red) */}
          <circle
            cx="50" cy="50" r="40"
            fill="none" stroke="var(--critical)" strokeWidth="8"
            strokeDasharray={`${critLen} ${circumference}`}
            strokeDashoffset={-(sugLen + warnLen)}
            transform="rotate(-90 50 50)"
            className="donut-segment"
          />
        </svg>
        <div className="donut-center">
          <span className="donut-total">{total}</span>
          <span className="donut-label">Issues</span>
        </div>
      </div>
      <div className="donut-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--critical)' }}></span>
          <span>Critical ({critical})</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--warning-sev)' }}></span>
          <span>Warning ({warning})</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--suggestion)' }}></span>
          <span>Suggestion ({suggestion})</span>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Animated counts
  const totalPRs = useCountUp(stats?.totalPRs || 0);
  const reviewedPRs = useCountUp(stats?.reviewedPRs || 0);
  const totalIssues = useCountUp(stats?.totalIssues || 0);
  const criticalIssues = useCountUp(stats?.criticalIssues || 0);
  const warningIssues = useCountUp(stats?.warningIssues || 0);
  const suggestionIssues = useCountUp(stats?.suggestionIssues || 0);
  const pendingPRs = useCountUp(stats?.pendingPRs || 0);
  const avgScore = useCountUp(stats?.avgCodeQualityScore || 0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({
        totalPRs: 0,
        reviewedPRs: 0,
        pendingPRs: 0,
        totalIssues: 0,
        criticalIssues: 0,
        warningIssues: 0,
        suggestionIssues: 0,
        avgCodeQualityScore: null,
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h2>Dashboard</h2>
          <p>Overview of your AI code review activity</p>
        </div>
        <SkeletonLoader type="stats" />
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="hero-section animate-in">
        <div className="hero-content">
          <div className="hero-badge">🛡️ AI-Powered Code Review</div>
          <h1 className="hero-title">GitGuard AI</h1>
          <p className="hero-subtitle">
            Automated code review that detects bugs, security vulnerabilities, and
            performance issues in your Pull Requests — powered by Google Gemini.
          </p>
          <div className="hero-stats-row">
            <div className="hero-stat">
              <span className="hero-stat-value">{totalPRs}</span>
              <span className="hero-stat-label">PRs Analyzed</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-value">{totalIssues}</span>
              <span className="hero-stat-label">Issues Found</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-value">{avgScore || '—'}</span>
              <span className="hero-stat-label">Avg Score</span>
            </div>
          </div>
        </div>
        <div className="hero-chart">
          <DonutChart
            critical={stats.criticalIssues}
            warning={stats.warningIssues}
            suggestion={stats.suggestionIssues}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatsCard icon="📊" value={totalPRs} label="Total PRs Analyzed" />
        <StatsCard icon="✅" value={reviewedPRs} label="Reviews Completed" />
        <StatsCard icon="🐛" value={totalIssues} label="Issues Detected" />
        <StatsCard icon="🔴" value={criticalIssues} label="Critical Issues" />
        <StatsCard icon="🟡" value={warningIssues} label="Warnings" />
        <StatsCard icon="🟢" value={suggestionIssues} label="Suggestions" />
        <StatsCard icon="⏳" value={pendingPRs} label="Pending Reviews" />
        <StatsCard icon="⭐" value={stats.avgCodeQualityScore || '—'} label="Avg. Quality Score" />
      </div>

      {/* Recent Activity */}
      <div className="table-container animate-in" style={{ animationDelay: '0.3s' }}>
        <div className="table-header">
          <h3>📡 Recent Activity</h3>
        </div>

        {stats.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="activity-feed" style={{ padding: '12px' }}>
            {stats.recentActivity.map((pr, index) => (
              <div
                className="activity-item clickable-row"
                key={pr._id || index}
                onClick={() => navigate(`/pr/${pr._id}`)}
              >
                <div className="activity-icon">
                  {pr.status === 'Reviewed' ? '✅' : pr.status === 'Error' ? '❌' : '⏳'}
                </div>
                <div className="activity-info">
                  <div className="repo-name">
                    {pr.repoName} #{pr.prNumber}
                  </div>
                  <div className="activity-meta">
                    {pr.prTitle || 'Pull Request'} • by {pr.author}
                    {pr.issuesFound > 0 && ` • ${pr.issuesFound} issues`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <QualityScore score={pr.codeQualityScore} />
                  <StatusBadge status={pr.status} />
                </div>
                <div className="activity-time">
                  {formatTimeAgo(pr.createdAt)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Activity Yet</h3>
            <p>When Pull Requests are analyzed, they will appear here. Configure a GitHub webhook to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
