import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { getHealth } from '../services/api';

const Sidebar = () => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const { data } = await getHealth();
      setIsOnline(data.status === 'ok');
    } catch {
      setIsOnline(false);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">🛡️</div>
          <div className="logo-text">
            <h1>GitGuard AI</h1>
            <span>PR Sentinel</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>

        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon">📊</span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/pr-history"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon">📋</span>
          <span>PR History</span>
        </NavLink>

        <div className="nav-section-label">System</div>

        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon">⚙️</span>
          <span>Settings</span>
        </NavLink>

        <NavLink
          to="/logs"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon">📜</span>
          <span>Logs</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="status-indicator">
          <div className={`status-dot ${isOnline ? '' : 'offline'}`}></div>
          <span>{isOnline ? 'System Online' : 'System Offline'}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
