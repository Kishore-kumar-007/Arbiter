import React from 'react';
import type { AppState } from '../../types/domain';

interface Props {
  state: AppState | null;
}

export const TelemetryCards: React.FC<Props> = ({ state }) => {
  if (!state) return null;

  const activeIncidents = Object.values(state.incidents).filter(i => i.status === 'active' || i.status === 'mitigating').length;
  
  let totalPop = 0;
  let capacity = 0;
  let safeZoneCap = 0;
  let safeZonePop = 0;
  
  Object.values(state.zones).forEach(z => {
    totalPop += z.current_population;
    if (z.capacity > 0) capacity += z.capacity;
    
    if (z.type === 'safe_zone') {
      safeZoneCap += z.capacity;
      safeZonePop += z.current_population;
    }
  });
  
  const availableResources = Object.values(state.resources).filter(r => r.status === 'available').length;
  const totalResources = Object.keys(state.resources).length;
  
  const safeZonePct = safeZoneCap > 0 ? Math.round((safeZonePop / safeZoneCap) * 100) : 0;
  
  // Calculate system risk
  const risk = activeIncidents > 2 ? 'HIGH' : activeIncidents > 0 ? 'ELEVATED' : 'NOMINAL';
  const riskColor = risk === 'HIGH' ? 'var(--hazard)' : risk === 'ELEVATED' ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="telemetry-row">
      <div className="telemetry-card">
        <span className="stat-label">Active Incidents</span>
        <div className="telemetry-value">{activeIncidents}</div>
      </div>
      <div className="telemetry-card">
        <span className="stat-label">Population Tracked</span>
        <div className="telemetry-value" style={{ color: 'var(--text-main)' }}>{totalPop}</div>
      </div>
      <div className="telemetry-card">
        <span className="stat-label">Available Units</span>
        <div className="telemetry-value">{availableResources} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>/ {totalResources}</span></div>
      </div>
      <div className="telemetry-card">
        <span className="stat-label">Safe Zone Usage</span>
        <div className="telemetry-value">{safeZonePct}%</div>
        <div className="metric-bar">
          <div className={`metric-fill ${safeZonePct > 90 ? 'danger' : safeZonePct > 75 ? 'warning' : ''}`} style={{ width: `${safeZonePct}%` }}></div>
        </div>
      </div>
      <div className="telemetry-card" style={{ borderLeft: `4px solid ${riskColor}` }}>
        <span className="stat-label">System Risk</span>
        <div className="telemetry-value" style={{ color: riskColor }}>{risk}</div>
      </div>
    </div>
  );
};
