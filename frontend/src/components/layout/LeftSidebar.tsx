import React from 'react';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const LeftSidebar: React.FC<Props> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'Overview', icon: '⏣' },
    { id: 'Incidents', icon: '⚠' },
    { id: 'Resources', icon: '⛊' },
    { id: 'Decisions', icon: '⚖' },
    { id: 'Simulation', icon: '⬡' },
    { id: 'Audit Trail', icon: '≡' }
  ];

  return (
    <nav className="sidebar">
      <div style={{ padding: '0 1.5rem 0.5rem 1.5rem', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
        COMMAND MODULES
      </div>
      
      {tabs.map(tab => (
        <div 
          key={tab.id}
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span style={{ marginRight: '0.75rem', fontSize: '0.9rem', opacity: activeTab === tab.id ? 1 : 0.5, color: activeTab === tab.id ? 'var(--accent)' : 'inherit' }}>{tab.icon}</span>
          <span style={{ fontWeight: activeTab === tab.id ? 600 : 500, letterSpacing: '0.5px' }}>{tab.id}</span>
        </div>
      ))}
      
      <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', margin: 'auto 1.5rem 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>SECURE IDENTITY</div>
        <div className="mono" style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--telemetry)', boxShadow: '0 0 8px var(--telemetry)' }}></div>
          CMD-ALPHA
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ID: 9X-442-B</div>
      </div>
    </nav>
  );
};
