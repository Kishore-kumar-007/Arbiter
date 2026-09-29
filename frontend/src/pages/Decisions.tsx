import React from 'react';

export const Decisions: React.FC = () => {
  return (
    <div className="main-workspace" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel" style={{ flex: 1 }}>
        <div className="panel-header">DECISION LOG</div>
        <div className="panel-content">
          <h2 style={{ margin: '0 0 1rem 0' }}>Strategy History</h2>
          <p style={{ color: 'var(--text-muted)' }}>This section will list all generated strategies and their approval/rejection status.</p>
          <div style={{ padding: '1rem', border: '1px dashed var(--border)', borderRadius: 4, color: 'var(--accent)' }}>
            Module Under Construction
          </div>
        </div>
      </div>
    </div>
  );
};
