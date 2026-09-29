import React from 'react';

export const Resources: React.FC = () => {
  return (
    <div className="main-workspace" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel" style={{ flex: 1 }}>
        <div className="panel-header">RESOURCE ALLOCATION</div>
        <div className="panel-content">
          <h2 style={{ margin: '0 0 1rem 0' }}>Deployed Units</h2>
          <p style={{ color: 'var(--text-muted)' }}>This section will manage individual response teams, their status, capacity, and current orders.</p>
          <div style={{ padding: '1rem', border: '1px dashed var(--border)', borderRadius: 4, color: 'var(--accent)' }}>
            Module Under Construction
          </div>
        </div>
      </div>
    </div>
  );
};
