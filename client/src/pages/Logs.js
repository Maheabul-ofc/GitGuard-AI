import React, { useState, useEffect } from 'react';
import { getLogs } from '../services/api';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, total: 1, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const fetchLogs = async (page) => {
    setLoading(true);
    try {
      const { data } = await getLogs(page, 30);
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatTimeTaken = (ms) => {
    if (!ms) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Success': return '✅';
      case 'Error': return '❌';
      case 'Pending': return '⏳';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Analysis Logs</h2>
        <p>Detailed log of all AI review operations and their results</p>
      </div>

      <div className="table-container animate-in">
        <div className="table-header">
          <h3>📜 Activity Log</h3>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {pagination.count} total entries
          </span>
        </div>

        {logs.length > 0 ? (
          <div>
            {logs.map((log, index) => (
              <div className="log-item" key={log._id || index}>
                <div className={`log-status-icon ${log.status ? log.status.toLowerCase() : 'pending'}`}>
                  {getStatusIcon(log.status)}
                </div>
                <div className="log-details">
                  <div className="log-title">
                    {log.repoName} #{log.prNumber} — {log.action}
                  </div>
                  <div className="log-summary">
                    {log.llmResponseSummary || 'No summary available'}
                  </div>
                  {log.errorMessage && (
                    <div style={{
                      color: 'var(--danger)',
                      fontSize: '12px',
                      marginTop: '4px',
                      padding: '4px 8px',
                      background: 'var(--danger-bg)',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      Error: {log.errorMessage}
                    </div>
                  )}
                  <div className="log-meta" style={{ marginTop: '8px' }}>
                    <div className="log-meta-item">
                      🕐 {formatDate(log.createdAt)}
                    </div>
                    <div className="log-meta-item">
                      ⏱️ {formatTimeTaken(log.timeTaken)}
                    </div>
                    <div className="log-meta-item">
                      {log.status === 'Success' ? (
                        <span style={{ color: 'var(--success)' }}>● Completed</span>
                      ) : log.status === 'Error' ? (
                        <span style={{ color: 'var(--danger)' }}>● Failed</span>
                      ) : (
                        <span style={{ color: 'var(--warning)' }}>● Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination.total > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                padding: '20px',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                {Array.from({ length: Math.min(pagination.total, 10) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => fetchLogs(page)}
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
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📜</div>
            <h3>No Logs Yet</h3>
            <p>Analysis logs will appear here when Pull Requests are processed by GitGuard AI.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
