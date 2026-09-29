import React from 'react';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const LeftSidebar: React.FC<Props> = ({ activeTab, onTabChange }) => {
  const tabs = ['Overview', 'Incidents', 'Resources', 'Decisions', 'Simulation', 'Audit Trail'];

  return (
    <nav className="sidebar">
      {tabs.map(tab => (
        <div 
          key={tab}
          className={`nav-item ${activeTab === tab ? 'active' : ''}`}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </div>
      ))}
      
      <div style={{ marginTop: 'auto', padding: '1.5rem' }}>
        <div className="stat-label">Operator</div>
        <div className="mono" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>CMD-ALPHA</div>
      </div>
    </nav>
  );
};
