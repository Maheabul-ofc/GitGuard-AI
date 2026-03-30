import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPullRequests } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import QualityScore from '../components/QualityScore';
import SkeletonLoader from '../components/SkeletonLoader';

const PRHistory = () => {
  const navigate = useNavigate();
  const [pullRequests, setPullRequests] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, total: 1, count: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchPRs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPRs = async (page) => {
    setLoading(true);
    try {
      const { data } = await getAllPullRequests(page, 15);
      setPullRequests(data.pullRequests);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch PRs:', error);
      setPullRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    fetchPRs(page);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPRs = filterStatus === 'all'
    ? pullRequests
    : pullRequests.filter(pr => pr.status === filterStatus);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h2>PR Review History</h2>
          <p>View all analyzed Pull Requests and their review status</p>
        </div>
        <SkeletonLoader type="table" count={8} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>PR Review History</h2>
        <p>View all analyzed Pull Requests and their review status</p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {['all', 'Reviewed', 'Pending', 'Analyzing', 'Error'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: `1px solid ${filterStatus === status ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              background: filterStatus === status ? 'var(--accent-subtle)' : 'transparent',
              color: filterStatus === status ? 'var(--accent-secondary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s ease'
            }}
          >
            {status === 'all' ? '🔗 All' : status}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container animate-in">
        {filteredPRs.length > 0 ? (
          <>
            <table>
              <thead>
                <tr>
                  <th>Repository</th>
                  <th>PR #</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Issues</th>
                  <th>Quality</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPRs.map((pr) => (
                  <tr
                    key={pr._id}
                    onClick={() => navigate(`/pr/${pr._id}`)}
                    className="clickable-row"
                  >
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {pr.repoName}
                    </td>
                    <td>
                      <span style={{
                        color: 'var(--accent-secondary)',
                        fontWeight: '600'
                      }}>
                        #{pr.prNumber}
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pr.prTitle || 'Untitled PR'}
                    </td>
                    <td>{pr.author}</td>
                    <td>
                      <span style={{
                        fontWeight: '700',
                        color: pr.issuesFound > 0 ? 'var(--warning)' : 'var(--success)'
                      }}>
                        {pr.issuesFound}
                      </span>
                    </td>
                    <td>
                      <QualityScore score={pr.codeQualityScore} />
                    </td>
                    <td>
                      <StatusBadge status={pr.status} />
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {formatDate(pr.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.total > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                padding: '20px',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                {Array.from({ length: pagination.total }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: `1px solid ${pagination.current === page ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      background: pagination.current === page ? 'var(--accent-primary)' : 'transparent',
                      color: pagination.current === page ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Pull Requests Found</h3>
            <p>
              {filterStatus !== 'all'
                ? `No PRs with status "${filterStatus}". Try a different filter.`
                : 'No PRs have been analyzed yet. Configure a GitHub webhook to start receiving PR events.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PRHistory;
