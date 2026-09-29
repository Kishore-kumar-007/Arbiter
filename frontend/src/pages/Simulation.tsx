import React from 'react';

export const Simulation: React.FC = () => {
  return (
    <div className="main-workspace" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel" style={{ flex: 1 }}>
        <div className="panel-header">COUNTERFACTUAL SIMULATION</div>
        <div className="panel-content">
          <h2 style={{ margin: '0 0 1rem 0' }}>What-If Scenario Sandbox</h2>
          <p style={{ color: 'var(--text-muted)' }}>This section will allow operators to inject new incidents or alter capacities to test the system's response.</p>
          <div style={{ padding: '1rem', border: '1px dashed var(--border)', borderRadius: 4, color: 'var(--accent)' }}>
            Module Under Construction
          </div>
        </div>
      </div>
    </div>
  );
};
