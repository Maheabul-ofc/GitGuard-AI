import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../services/api';

const Settings = () => {
  const [settings, setSettings] = useState({
    strictMode: false,
    ignoreStylingIssues: false,
    enableSecurityScan: true,
    enablePerformanceScan: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await getSettings();
      setSettings({
        strictMode: data.strictMode,
        ignoreStylingIssues: data.ignoreStylingIssues,
        enableSecurityScan: data.enableSecurityScan,
        enablePerformanceScan: data.enablePerformanceScan
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);

    setSaving(true);
    try {
      await updateSettings(newSettings);
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('Failed to save settings');
      // Revert
      setSettings(settings);
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const toggleItems = [
    {
      key: 'strictMode',
      icon: '⚡',
      title: 'Strict Mode',
      description: 'Apply the highest coding standards. Even minor issues will be flagged with detailed explanations.'
    },
    {
      key: 'ignoreStylingIssues',
      icon: '🎨',
      title: 'Ignore Styling Issues',
      description: 'Skip code formatting and style-related suggestions. Focus only on logic, security, and performance.'
    },
    {
      key: 'enableSecurityScan',
      icon: '🔐',
      title: 'Enable Security Scan',
      description: 'Detect SQL injection, XSS, hardcoded secrets, insecure dependencies, and other security vulnerabilities.'
    },
    {
      key: 'enablePerformanceScan',
      icon: '🚀',
      title: 'Enable Performance Scan',
      description: 'Identify memory leaks, N+1 queries, unnecessary re-renders, and blocking operations.'
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Settings</h2>
        <p>Configure how GitGuard AI reviews your Pull Requests</p>
      </div>

      {/* Save message */}
      {saveMessage && (
        <div style={{
          padding: '12px 20px',
          marginBottom: '20px',
          borderRadius: 'var(--radius-md)',
          background: saveMessage.includes('success') ? 'var(--success-bg)' : 'var(--danger-bg)',
          color: saveMessage.includes('success') ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${saveMessage.includes('success') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          fontSize: '14px',
          fontWeight: '500',
          animation: 'fadeIn 0.3s ease'
        }}>
          {saveMessage.includes('success') ? '✅' : '❌'} {saveMessage}
        </div>
      )}

      {/* Toggle Items */}
      <div className="toggle-group">
        {toggleItems.map((item, index) => (
          <div
            className="toggle-item animate-in"
            key={item.key}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
              <div style={{
                fontSize: '24px',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--accent-subtle)',
                borderRadius: 'var(--radius-sm)',
                flexShrink: 0
              }}>
                {item.icon}
              </div>
              <div className="toggle-info">
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings[item.key]}
                onChange={() => handleToggle(item.key)}
                disabled={saving}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        ))}
      </div>

      {/* Webhook Info */}
      <div className="card animate-in" style={{ marginTop: '30px', animationDelay: '0.4s' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>🔗 Webhook Configuration</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
          To connect GitGuard AI to your GitHub repositories, set up a webhook with the following details:
        </p>
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          fontFamily: 'monospace',
          fontSize: '13px',
          color: 'var(--text-accent)',
          lineHeight: '1.8'
        }}>
          <div><strong style={{ color: 'var(--text-muted)' }}>Payload URL:</strong> http://your-server:5000/api/webhook/github</div>
          <div><strong style={{ color: 'var(--text-muted)' }}>Content type:</strong> application/json</div>
          <div><strong style={{ color: 'var(--text-muted)' }}>Secret:</strong> (set in your .env file)</div>
          <div><strong style={{ color: 'var(--text-muted)' }}>Events:</strong> Pull requests</div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
