import React from 'react';

export const TopCommandBar: React.FC = () => {
  return (
    <header className="top-bar">
      <div className="brand">
        ARBITER <span className="brand-accent">///</span>
      </div>
      
      <div className="top-bar-stats">
        <div className="stat-group">
          <span className="stat-label">Situation</span>
          <span className="stat-value">CAMPUS EMERGENCY</span>
        </div>
        <div className="stat-group">
          <span className="stat-label">System Status</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>OPERATIONAL</span>
        </div>
        <div className="stat-group">
          <span className="stat-label">Sim Time</span>
          <span className="stat-value">T+00:14:22</span>
        </div>
        <div className="live-indicator">
          <div className="live-dot"></div>
          LIVE SIMULATION
        </div>
      </div>
    </header>
  );
};
