import React from 'react';
import type { AppState, Incident } from '../../types/domain';

interface Props {
  incident: Incident;
  state: AppState;
  onClose: () => void;
}

export const IncidentDetailPanel: React.FC<Props> = ({ incident, state, onClose }) => {
  const zone = state.zones[incident.zone_id];
  
  // Find resources in the same zone
  const relatedResources = Object.values(state.resources).filter(
    (res) => res.current_zone_id === incident.zone_id
  );

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'var(--hazard)';
    if (severity >= 5) return 'var(--warning)';
    return 'var(--telemetry)';
  };
  
  const getSeverityLabel = (severity: number) => {
    if (severity >= 8) return 'CRITICAL';
    if (severity >= 5) return 'HIGH';
    if (severity >= 3) return 'MEDIUM';
    return 'LOW';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'var(--hazard)';
      case 'mitigating': return 'var(--warning)';
      case 'resolved': return 'var(--success)';
      default: return 'var(--text-muted)';
    }
  };

  const popRatio = zone && zone.capacity > 0 ? (zone.current_population / zone.capacity) * 100 : 0;

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: 'var(--bg-panel)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--hazard)', boxShadow: '0 0 8px var(--hazard)' }}></div>
          INCIDENT INTELLIGENCE
        </span>
        <button 
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', padding: '0.2rem 0.5rem' }}
        >
          ×
        </button>
      </div>
      
      <div className="panel-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1.5rem' }}>
        
        {/* Header Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <h2 className="mono" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {incident.type.replace('_', ' ')}
            </h2>
            <div style={{ 
              padding: '0.25rem 0.75rem', 
              border: `1px solid ${getSeverityColor(incident.severity)}`,
              color: getSeverityColor(incident.severity),
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '2px',
              background: `linear-gradient(90deg, ${getSeverityColor(incident.severity)}20, transparent)`,
              letterSpacing: '1px'
            }}>
              {getSeverityLabel(incident.severity)} (SEV {incident.severity})
            </div>
          </div>
          
          <div className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '1px' }}>
            ID: {incident.id.toUpperCase()} <span style={{ opacity: 0.5, margin: '0 0.5rem' }}>|</span> DETECTED: T-00:14
          </div>
        </div>

        {/* Status & Location */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="panel-nested" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>CURRENT STATUS</div>
            <div className="mono" style={{ 
              color: getStatusColor(incident.status), 
              fontWeight: 700, 
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textShadow: incident.status === 'active' ? `0 0 10px ${getStatusColor(incident.status)}80` : 'none'
            }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: getStatusColor(incident.status),
                boxShadow: `0 0 8px ${getStatusColor(incident.status)}`
              }} className={incident.status === 'active' ? 'blink' : ''} />
              {incident.status}
            </div>
          </div>
          <div className="panel-nested" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>LOCATION</div>
            <div style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.9rem' }}>
              {zone ? zone.name : incident.zone_id}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '1px' }}>SITUATION REPORT</div>
          <div className="panel-nested" style={{ 
            padding: '1.25rem', 
            lineHeight: 1.6,
            fontSize: '0.85rem',
            borderLeft: `3px solid ${getSeverityColor(incident.severity)}`
          }}>
            {incident.description}
          </div>
        </div>

        {/* Affected Zone Data */}
        {zone && (
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '1px' }}>AFFECTED SECTOR TELEMETRY</div>
            <div className="panel-nested" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>POPULATION LOAD</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span className="mono" style={{ fontWeight: 700, fontSize: '1.2rem', color: popRatio > 90 ? 'var(--hazard)' : 'var(--text-main)' }}>{zone.current_population.toLocaleString()}</span>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ {zone.capacity > 0 ? zone.capacity.toLocaleString() : '∞'}</span>
                </div>
              </div>
              {zone.capacity > 0 && (
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '0.5rem' }}>
                  <div style={{ 
                    width: `${Math.min(100, popRatio)}%`, 
                    height: '100%', 
                    background: popRatio > 90 ? 'var(--hazard)' : popRatio > 75 ? 'var(--warning)' : 'var(--telemetry)',
                    boxShadow: `0 0 10px ${popRatio > 90 ? 'var(--hazard)' : popRatio > 75 ? 'var(--warning)' : 'var(--telemetry)'}`
                  }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Related Resources */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '1px' }}>LOCAL RESPONSE UNITS</div>
          {relatedResources.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {relatedResources.map(res => (
                <div key={res.id} className="interactive-row" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '1rem', 
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${res.status === 'dispatched' ? 'var(--warning)' : 'var(--accent)'}`,
                  background: 'var(--bg-panel-nested)',
                  borderRadius: '4px',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.25rem', opacity: 0.8 }}>
                      {res.type === 'fire' ? '🚒' : res.type === 'medical' ? '🚑' : '🛡'}
                    </span>
                    <div>
                      <div className="mono" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{res.id.toUpperCase()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem' }}>{res.type}</div>
                    </div>
                  </div>
                  <div className="mono" style={{ 
                    fontSize: '0.7rem', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '2px',
                    background: 'rgba(0,0,0,0.5)',
                    color: res.status === 'dispatched' ? 'var(--warning)' : 'var(--telemetry)',
                    border: `1px solid ${res.status === 'dispatched' ? 'var(--warning)' : 'var(--telemetry)'}`,
                    letterSpacing: '1px'
                  }}>
                    {res.status.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--warning)', border: '1px dashed var(--warning)', opacity: 0.7, borderRadius: '4px', fontSize: '0.8rem', background: 'var(--warning-dark)' }}>
              No response units currently positioned in this sector.
            </div>
          )}
        </div>

        {/* Timeline */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '1px' }}>EVENT TIMELINE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', paddingLeft: '0.5rem' }}>
            <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border)' }} />
            
            <div style={{ display: 'flex', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'var(--bg-main)', border: '2px solid var(--hazard)', marginTop: '2px', boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }} />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.5px' }}>THREAT DETECTED</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Initial automated alert received from sector sensors.</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'var(--bg-main)', border: '2px solid var(--telemetry)', marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.5px' }}>SITUATION ANALYZED</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Severity assessed as {getSeverityLabel(incident.severity)} (Level {incident.severity}).</div>
              </div>
            </div>
            
            {incident.status !== 'active' && (
               <div style={{ display: 'flex', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
               <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'var(--bg-main)', border: `2px solid ${getStatusColor(incident.status)}`, marginTop: '2px', boxShadow: `0 0 10px ${getStatusColor(incident.status)}` }} />
               <div>
                 <div style={{ fontSize: '0.85rem', fontWeight: 700, color: getStatusColor(incident.status), letterSpacing: '0.5px' }}>STATUS UPDATE: {incident.status.toUpperCase()}</div>
                 <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Response actions are mitigating the incident state.</div>
               </div>
             </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
