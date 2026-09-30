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
      <div className="strip-item" style={{ flex: '0 0 200px', background: 'var(--bg-panel-nested)', borderRight: '1px solid var(--border)' }}>
        <div className="strip-label">SITUATION STATUS</div>
        <div className="strip-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: riskColor, textShadow: risk === 'CRITICAL' ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: riskColor, boxShadow: `0 0 8px ${riskColor}` }} className={risk === 'CRITICAL' ? 'blink' : ''}></div>
          {risk}
        </div>
      </div>
      <div className="strip-item">
        <div className="strip-label">ACTIVE INCIDENTS</div>
        <div className="strip-value" style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', color: activeIncidents > 0 ? 'var(--warning)' : 'var(--text-main)' }}>
          {activeIncidents} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>↑1</span>
        </div>
      </div>
      <div className="strip-item">
        <div className="strip-label">POPULATION AT RISK</div>
        <div className="strip-value" style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
          {totalPop.toLocaleString()} <span style={{ fontSize: '0.65rem', color: 'var(--hazard)' }}>+142</span>
        </div>
      </div>
      <div className="strip-item">
        <div className="strip-label">AVAILABLE UNITS</div>
        <div className="strip-value">
          <span style={{ color: availableResources === 0 ? 'var(--hazard)' : 'var(--telemetry)', textShadow: availableResources > 0 ? '0 0 10px rgba(0, 229, 255, 0.3)' : 'none' }}>{availableResources}</span>
          <span style={{ color: 'var(--border-light)', fontSize: '0.8rem' }}> / {totalResources}</span>
        </div>
      </div>
      <div className="strip-item">
        <div className="strip-label">BLOCKED ROUTES</div>
        <div className="strip-value" style={{ color: 'var(--hazard)' }}>1</div>
      </div>
      <div className="strip-item">
        <div className="strip-label">SAFE-ZONE CAPACITY</div>
        <div className="strip-value" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: safeZonePct > 90 ? 'var(--hazard)' : 'var(--success)' }}>{safeZonePct}%</span>
          <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${safeZonePct}%`, height: '100%', background: safeZonePct > 90 ? 'var(--hazard)' : 'var(--success)', transition: 'width 0.5s ease-out' }}></div>
          </div>
        </div>
      </div>
      <div className="strip-item" style={{ flex: '0 0 160px', borderLeft: '1px solid var(--border)', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.02))' }}>
        <div className="strip-label">SYS RISK INDEX</div>
        <div className="strip-value" style={{ color: riskColor, display: 'flex', alignItems: 'baseline', gap: '0.4rem', textShadow: risk === 'CRITICAL' ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none' }}>
          {risk === 'CRITICAL' ? '87.4' : risk === 'ELEVATED' ? '54.2' : '12.0'}
          {risk === 'CRITICAL' && <span style={{ fontSize: '0.65rem', color: 'var(--hazard)' }}>↑</span>}
        </div>
      </div>
    </div>
  );
};
