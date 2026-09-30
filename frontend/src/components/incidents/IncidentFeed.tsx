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
    <div className="panel" style={{ gridRow: '2 / span 2', gridColumn: '1', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ padding: '0.6rem 1rem' }}>
        <span>INCIDENT INTELLIGENCE</span>
        <span className="mono" style={{ color: 'var(--hazard)' }}>{incidents.length} ACTIVE</span>
      </div>
      <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', overflowY: 'auto', flex: 1 }}>
        
        {incidents.map((inc, i) => {
          let severityLabel = 'MEDIUM';
          let badgeClass = 'warning';
          let ringColor = 'rgba(255, 145, 0, 0.3)';
          
          if (inc.severity > 7) {
            severityLabel = 'CRITICAL';
            badgeClass = 'hazard';
            ringColor = 'rgba(239, 68, 68, 0.5)';
          } else if (inc.severity > 5) {
            severityLabel = 'HIGH';
          }

          return (
            <div 
              key={inc.id} 
              className="interactive-row panel-nested"
              style={{ 
                padding: '0.75rem',
                borderLeft: `3px solid var(--${badgeClass})`,
                background: i === 0 ? 'rgba(255,255,255,0.03)' : 'var(--bg-panel)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Subtle background glow for the highest severity incident */}
              {i === 0 && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: `linear-gradient(90deg, ${ringColor}, transparent)`, opacity: 0.2, pointerEvents: 'none' }}></div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', position: 'relative' }}>
                <span className={`badge ${badgeClass}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>{severityLabel} • SEV {inc.severity}</span>
                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>T-00:14</span>
              </div>
              
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: badgeClass === 'hazard' ? 'var(--hazard)' : 'var(--text-main)', margin: '0.25rem 0', letterSpacing: '0.5px' }}>
                {inc.type.replace('_', ' ').toUpperCase()}
              </div>
              
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                {inc.description}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-panel-nested)', padding: '0.2rem 0.5rem', borderRadius: 4, border: '1px solid var(--border)' }}>
                  <span style={{ opacity: 0.5 }}>📍</span> {state.zones[inc.zone_id]?.name || inc.zone_id.toUpperCase()}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: inc.status === 'active' ? 'var(--hazard)' : 'var(--warning)', boxShadow: `0 0 8px var(--${inc.status === 'active' ? 'hazard' : 'warning'})` }} className={inc.status === 'active' ? 'blink' : ''}></div>
                  <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{inc.status}</span>
                </div>
              </div>
            </div>
          );
        })}

        {incidents.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--success-dark)', border: '1px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>✓</div>
            NO ACTIVE INCIDENTS
          </div>
        )}
      </div>
      
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
        <button className="btn" style={{ width: '100%', fontSize: '0.7rem' }} onClick={() => onTabChange?.('Incidents')}>EXPAND INCIDENT LOG</button>
      </div>
    </div>
  );
};
