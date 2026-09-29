import React from 'react';

export const TopCommandBar: React.FC = () => {
  return (
    <header className="top-bar">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="brand">ARBITER</div>
        <div className="brand-sub">Human-in-the-Loop Decision Intelligence</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }}></div>
        <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 700, letterSpacing: '1px' }}>SYSTEM OPERATIONAL</span>
      </div>
      
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>SIMULATION ENVIRONMENT</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--warning)', letterSpacing: '1px' }}>CAMPUS EMERGENCY</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>T+ SIM TIME</span>
          <span className="mono blink" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>00:14:22</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
          <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>OP CMD-ALPHA</span>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700 }}>AUTHENTICATED</span>
        </div>
      </div>
    </header>
  );
};
