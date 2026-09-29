import React from 'react';
import type { AppState } from '../../types/domain';

interface Props {
  state: AppState | null;
}

export const SituationStrip: React.FC<Props> = ({ state }) => {
  if (!state) return null;

  const activeIncidents = Object.values(state.incidents).filter(i => i.status === 'active' || i.status === 'mitigating').length;
  
  let totalPop = 0;
  let safeZoneCap = 0;
  let safeZonePop = 0;
  
  Object.values(state.zones).forEach(z => {
    totalPop += z.current_population;
    if (z.type === 'safe_zone') {
      safeZoneCap += z.capacity;
      safeZonePop += z.current_population;
    }
  });
  
  const availableResources = Object.values(state.resources).filter(r => r.status === 'available').length;
  const totalResources = Object.keys(state.resources).length;
  const safeZonePct = safeZoneCap > 0 ? Math.round((safeZonePop / safeZoneCap) * 100) : 0;
  
  const risk = activeIncidents > 1 ? 'CRITICAL' : activeIncidents > 0 ? 'ELEVATED' : 'NOMINAL';
  const riskColor = risk === 'CRITICAL' ? 'var(--hazard)' : risk === 'ELEVATED' ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="situation-strip">
      <div className="strip-item" style={{ flex: '0 0 200px', background: 'rgba(255,255,255,0.02)' }}>
        <div className="strip-label">Current Situation</div>
        <div className="strip-value" style={{ color: riskColor }}>{risk}</div>
      </div>
      <div className="strip-item">
        <div className="strip-label">Active Incidents</div>
        <div className="strip-value" style={{ color: activeIncidents > 0 ? 'var(--warning)' : 'var(--text-main)' }}>{activeIncidents}</div>
      </div>
      <div className="strip-item">
        <div className="strip-label">Population At Risk</div>
        <div className="strip-value">{totalPop}</div>
      </div>
      <div className="strip-item">
        <div className="strip-label">Available Units</div>
        <div className="strip-value">
          <span style={{ color: availableResources === 0 ? 'var(--hazard)' : 'var(--telemetry)' }}>{availableResources}</span>
          <span style={{ color: 'var(--border-light)' }}> / {totalResources}</span>
        </div>
      </div>
      <div className="strip-item">
        <div className="strip-label">Blocked Routes</div>
        <div className="strip-value">1</div>
      </div>
      <div className="strip-item">
        <div className="strip-label">Safe-Zone Capacity</div>
        <div className="strip-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: safeZonePct > 90 ? 'var(--hazard)' : 'var(--success)' }}>{safeZonePct}%</span>
          <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${safeZonePct}%`, height: '100%', background: safeZonePct > 90 ? 'var(--hazard)' : 'var(--success)' }}></div>
          </div>
        </div>
      </div>
      <div className="strip-item" style={{ flex: '0 0 150px' }}>
        <div className="strip-label">Overall Risk</div>
        <div className="strip-value" style={{ color: riskColor }}>
          {risk === 'CRITICAL' ? '87.4' : risk === 'ELEVATED' ? '54.2' : '12.0'}
        </div>
      </div>
    </div>
  );
};
