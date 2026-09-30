import React, { useState, useEffect } from 'react';

export const TopCommandBar: React.FC = () => {
  const [time, setTime] = useState(new Date().toISOString().substring(11, 19));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toISOString().substring(11, 19));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="top-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 22 22 22"></polygon>
            </svg>
            ARBITER
          </div>
          <div className="brand-sub">Decision Intelligence Platform</div>
        </div>

        <div style={{ width: 1, height: '2rem', background: 'var(--border)' }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div className="sys-status-indicator"></div>
          <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 700, letterSpacing: '1px' }}>SYSTEM NOMINAL</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>ACTIVE ENVIRONMENT</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }}></span>
            CAMPUS EMERGENCY
          </span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '90px' }}>
          <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>UTC CLOCK</span>
          <span className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--telemetry)', textShadow: '0 0 8px var(--telemetry-dark)' }}>{time}</span>
        </div>
      </div>
    </header>
  );
};
