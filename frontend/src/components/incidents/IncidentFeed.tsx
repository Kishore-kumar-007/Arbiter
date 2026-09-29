import React from 'react';
import type { AppState } from '../../types/domain';

interface Props {
  state: AppState | null;
  onTabChange?: (tab: string) => void;
}

export const IncidentFeed: React.FC<Props> = ({ state, onTabChange }) => {
  if (!state) return null;

  const incidents = Object.values(state.incidents).sort((a, b) => b.severity - a.severity);

  return (
    <div className="panel" style={{ gridRow: '2 / span 2', gridColumn: '1' }}>
      <div className="panel-header">
        <span>INCIDENT INTELLIGENCE</span>
        <span className="mono">{incidents.length} ACTIVE</span>
      </div>
      <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
        
        {incidents.map(inc => {
          let severityLabel = 'MEDIUM';
          let badgeClass = 'warning';
          if (inc.severity > 7) {
            severityLabel = 'CRITICAL';
            badgeClass = 'hazard';
          } else if (inc.severity > 5) {
            severityLabel = 'HIGH';
          }

          return (
            <div key={inc.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span className={`badge ${badgeClass}`}>{severityLabel}</span>
                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>14:15:02</span>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: badgeClass === 'hazard' ? 'var(--hazard)' : 'var(--text-main)', margin: '0.25rem 0' }}>
                {inc.type.replace('_', ' ').toUpperCase()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {state.zones[inc.zone_id]?.name || inc.zone_id}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem' }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: inc.status === 'active' ? 'var(--hazard)' : 'var(--warning)' }}></div>
                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{inc.status}</span>
              </div>
            </div>
          );
        })}

        {incidents.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '2rem 0' }}>
            No active incidents detected.
          </div>
        )}

        <button className="btn" style={{ marginTop: 'auto' }} onClick={() => onTabChange?.('Incidents')}>VIEW ALL INCIDENTS →</button>
      </div>
    </div>
  );
};
